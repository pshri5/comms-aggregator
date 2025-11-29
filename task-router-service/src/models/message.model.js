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

},{timestamps:true})