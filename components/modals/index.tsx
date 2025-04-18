import React from "react";

import CoverImageModal from "./coverimage-modal";
import EmojiPickerDialog from "./emojipicker-modal";
import PublishModal from "./publish-modal";
import SettingsModal from "./setttings-modal";
import SonnetSyncModal from "./sonnet-sync-modal";
import TrashBoxModal from "./trashbox-modal";

const ModalsProvider = () => {
  return (
    <>
      <TrashBoxModal />
      <SettingsModal />
      <SonnetSyncModal />
      <PublishModal />
    </>
  );
};

export default ModalsProvider;
