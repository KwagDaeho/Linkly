import { filterOpenAppEditorApps } from "@/domain/apps";
import { usePrefs } from "@/hooks/prefs";
import { useProfileCtx } from "@/hooks/profile";
import { useEditor } from "@/hooks/editor";
import { Modal, ModalActions, SrOnly } from "@/components/ui";
import type { InstalledAppWithIcon, OpenAppEditorState } from "@/types";

import { OpenAppPicker } from "./OpenAppPicker";
import * as styles from "./OpenAppEditor.css";

interface OpenAppEditorProps {
  editor: OpenAppEditorState;
}

export const OpenAppEditor = (props: OpenAppEditorProps) => {
  const { i18n } = usePrefs();
  const { mappings } = useProfileCtx();
  const { setEditor } = useEditor();
  const editor = props.editor;
  const filteredApps = filterOpenAppEditorApps(editor);

  const handleSave = () => {
    if (editor.selected === null) {
      return;
    }
    mappings.updateSlot(editor.target, editor.slot, {
      type: "open_app",
      bundle_id: editor.selected.bundleId,
      name: editor.selected.name,
    });
    setEditor(null);
  };

  const handleSelect = (app: InstalledAppWithIcon) => {
    setEditor({
      ...editor,
      selected: { name: app.name, bundleId: app.bundleId },
    });
  };

  return (
    <Modal
      wide
      title={i18n.openAppTitle}
      hint={i18n.openAppHint}
      onEscape={() => setEditor(null)}
    >
      <label className={styles.search}>
        <SrOnly>{i18n.openAppSearch}</SrOnly>
        <input
          type="search"
          autoFocus
          placeholder={i18n.openAppSearch}
          value={editor.query}
          onChange={(event) =>
            setEditor({ ...editor, query: event.target.value })
          }
        />
      </label>
      <OpenAppPicker
        editor={editor}
        apps={filteredApps}
        loadingLabel={i18n.openAppLoading}
        errorLabel={i18n.openAppError}
        emptyLabel={i18n.openAppEmpty}
        onSelect={handleSelect}
      />
      <ModalActions
        cancelLabel={i18n.cancel}
        onCancel={() => setEditor(null)}
        confirmLabel={i18n.save}
        onConfirm={handleSave}
        confirmDisabled={editor.selected === null}
      />
    </Modal>
  );
};
