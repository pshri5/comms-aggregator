// delivery-service/src/models/delivery.model.js
import mongoose, { Schema } from "mongoose";

const deliverySchema = new Schema({
  messageId: {
    type: String,
    required: true,
    unique: true,
  },
  traceId: {
    type: String,
    required: true,
  },
  channel: {
    type: String,
    required: true,
    enum: ["email", "whatsapp", "sms"],
  },
  content: {
    recipient: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      required: function() {
        return this.channel === 'email';
      }
    },
    body: {
      type: String,
      required: true,
    },
  },
  status: {
    type: String,
    enum: ["pending", "delivered", "failed"],
    default: "pending",
  },
  deliveredAt: {
    type: Date,
  },
  error: {
    type: String,
  },
}, { timestamps: true });

// Create indexes
deliverySchema.index({ messageId: 1 }, { unique: true });
deliverySchema.index({ status: 1, channel: 1 });
deliverySchema.index({ traceId: 1 });

const Delivery = mongoose.model("Delivery", deliverySchema);

export default Delivery;