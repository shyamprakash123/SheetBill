// src/utils/getInitials.js

export const getInitials = (name) => {
  // Return empty string if name is not a valid string
  if (!name || typeof name !== 'string') {
    return '';
  }

  // Split the name by spaces and filter out any empty strings
  const words = name.trim().split(/\s+/).filter(Boolean);

  // If there are no words, return empty string
  if (words.length === 0) {
    return '';
  }

  // If there is only one word, return its first letter
  if (words.length === 1) {
    return words[0][0].toUpperCase();
  }

  // If there are two or more words, return the first letter of the first two words
  const initials = words[0][0] + words[1][0];
  
  return initials.toUpperCase();
};