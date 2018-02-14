const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Message = require("./message");

const relationshipSchema = new Schema({
	users: {
		type: [Schema.Types.ObjectId],
		ref: 'User'
	},
	accepted: {
		type: Boolean,
		default: false
	}
}, {
		timestamps: { createdAt: "created_at", updatedAt: "updated_at" }
	});

relationshipSchema.virtual('messages', {
	ref: 'Message',  
	localField: '_id',  
	foreignField: 'relation' 
});

const Relationship = mongoose.model("Relationship", relationshipSchema);

module.exports = Relationship;