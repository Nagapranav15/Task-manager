const mongoose =require("mongoose");
const { create } = require("./User");

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

const todoSchema=new mongoose.Schema(
    {
        text:{type:String,required:true},
        completed:{type:Boolean,default:false},
    }
);

const taskSchema=new mongoose.Schema(
    {
        title:{type:String,required:true},
        slug:{type:String,unique:true,sparse:true},
        description:{type:String},
        priority:{type:String,enum:["Low","Medium","High"],default:"Medium"},
        status:{type:String,enum:["Pending","In Progress","Completed","Blocked"],default:"Pending"},
        dueDate:{type:Date, required:true},
        assignedTo:[{type:mongoose.Schema.Types.ObjectId,ref:"User"}],
        createdBy:{type:mongoose.Schema.Types.ObjectId,ref:"User"},
        attachments:[{type:String}],
        todochecklist:[todoSchema],
        progress:{type:Number,default:0}, // Progress percentage
        googleEventId:{type:String,default:null},
    },
    {timestamps:true}
);
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ createdBy: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ createdAt: -1 });

// Compound indexes for optimized dashboard queries
taskSchema.index({ assignedTo: 1, createdAt: -1 });
taskSchema.index({ createdBy: 1, createdAt: -1 });
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ status: 1, dueDate: 1 });
taskSchema.index({ assignedTo: 1, status: 1, dueDate: 1 });

taskSchema.pre("save", function (next) {
    if (this.isModified("title") || !this.slug) {
        this.slug = slugify(this.title) + "-" + this._id.toString().substring(18);
    }
    next();
});

module.exports=mongoose.model("Task",taskSchema);