const mongoose = require("mongoose");
const Schema = mongoose.Schema;

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

const Relationship = mongoose.model("Relationship", relationshipSchema);

module.exports = Relationship;