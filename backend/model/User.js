const mongoose=require("mongoose");


const userSchema=new mongoose.Schema(
    {
    name:{type:String,required:true},
    email:{type:String,required:true,unique:true},
    password:{type:String,required:true},
    profileImageUrl:{type:String,default:null},
    role:{type:String, enum:["admin","manager","member"],default:"member"},// Role based access control
    },
    {timestamps:true}
);

module.exports=mongoose.model("User",userSchema);