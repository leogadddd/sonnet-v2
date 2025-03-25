import React from "react";

import CoverImageModal from "./coverimage-modal";
import EmojiPickerDialog from "./emojipicker-modal";
import SettingsModal from "./setttings-modal";
import SonnetSyncModal from "./sonnet-sync-modal";
import TrashBoxModal from "./trashbox-modal";

const ModalsProvider = () => {
  return (
    <>
      <CoverImageModal />
      <EmojiPickerDialog />
      <TrashBoxModal />
      <SettingsModal />
      <SonnetSyncModal />
    </>
  );
};

export default ModalsProvider;
