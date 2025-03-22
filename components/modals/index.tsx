import React from "react";

import CoverImageModal from "./coverimage-modal";
import EmojiPickerDialog from "./emojipicker-modal";
import SettingsModal from "./setttings-modal";
import TrashBoxModal from "./trashbox-modal";

const ModalsProvider = () => {
  return (
    <>
      <CoverImageModal />
      <EmojiPickerDialog />
      <TrashBoxModal />
      <SettingsModal />
    </>
  );
};

export default ModalsProvider;
