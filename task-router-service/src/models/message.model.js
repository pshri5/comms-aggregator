import mongooose,{Schema} from "mongoose"

const messageSchema = new Schema({
    id:{
        type: String,
        required: true,
        unique: true
    },
    traceId:{
        type: String,
        required: true
    },
    channel:{
        type: String,
        required: true,
        enum: ["email","whatsapp","sms"]
    },
    content:{
       recipient: { 
      type: String, 
      required: true 
    },
    subject: { 
      type: String,
      required: function() { 
        return this.channel === 'email'; 
      } 
    },
    body :{
        type: String,
        required: true
    }
    },
    status:{
        type: String,
        enum: ["Pending","Delivered","failed"],
        default: "Pending"
    },
    attempts:{
        type: Number,
        default: 0, 
    },
    lastAttempt:{
        type: Date
    },
    
},{timestamps:true})

//create indexes
messageSchema.index({ 'content.recipient': 1, 'content.body': 1, channel: 1, createdAt: 1 });
messageSchema.index({ status: 1, attempts: 1 });
messageSchema.index({ id: 1 }, { unique: true });

const Message = mongoose.model("Message", messageSchema)

export default Message