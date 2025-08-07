// src/components/Avatar.jsx

import React from "react";
import { getInitials } from "../utils/getInitials"; // Adjust the import path as needed

const Avatar = ({ name, colour }) => {
  const initials = getInitials(name);

  return (
    <div
      className={`w-12 h-12 px-6 ${
        colour === "blue" ? "bg-blue-400" : "bg-orange-500"
      }  rounded-full flex items-center justify-center text-white font-semibold`}
    >
      {initials}
    </div>
  );
};

export default Avatar;
