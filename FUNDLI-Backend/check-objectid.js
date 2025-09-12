// Check if the loan ID is a valid MongoDB ObjectId
const mongoose = require('mongoose');

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

const loanId = '68c184e2e2a0e5fa25ece076';
console.log('Loan ID:', loanId);
console.log('Length:', loanId.length);
console.log('Is valid ObjectId:', isValidObjectId(loanId));

// Check what a valid ObjectId looks like
const validId = new mongoose.Types.ObjectId();
console.log('Valid ObjectId example:', validId.toString());
console.log('Valid ObjectId length:', validId.toString().length);

