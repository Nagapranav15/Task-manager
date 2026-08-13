require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const Task = require("../model/Task");

const slugify = (text) => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
};

const backfillSlugs = async () => {
    try {
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGO_URL);
        }
        console.log("[Backfill] Connected to MongoDB.");

        const tasks = await Task.find({ $or: [{ slug: { $exists: false } }, { slug: null }, { slug: "" }] });
        console.log(`[Backfill] Found ${tasks.length} tasks needing slug backfill.`);

        let updatedCount = 0;
        for (const task of tasks) {
            const rawId = task._id.toString();
            const generatedSlug = slugify(task.title || "task") + "-" + rawId.substring(18);
            task.slug = generatedSlug;
            await task.save();
            updatedCount++;
        }

        console.log(`[Backfill] Successfully backfilled ${updatedCount} task slugs.`);
    } catch (err) {
        console.error("[Backfill Error]:", err);
    } finally {
        await mongoose.connection.close();
    }
};

if (require.main === module) {
    backfillSlugs().then(() => process.exit(0));
}

module.exports = backfillSlugs;
