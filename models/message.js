const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const messageSchema = new Schema({
	sender: {
		type: Schema.Types.ObjectId,
		ref: 'User'
	},
	reciever: {
		type: Schema.Types.ObjectId,
		ref: 'User'
	},
	read: {
		type: Boolean,
		default: false
	},
	text: {
		type: String,
		required: [true, "You must write some text."]
	},
	relation: {
		type: Schema.Types.ObjectId,
		ref: 'Relationship'
	}
}, {
		timestamps: { createdAt: "created_at", updatedAt: "updated_at" }
	});

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;