import { useEditor } from "@/hooks/editor";

import { BallScrollActivatorEditor } from "./ballScroll";
import { ComboActivatorEditor } from "./combo";
import { CustomKeyEditor } from "./customKey";
import { MacroEditor } from "./macro";
import { OpenAppEditor } from "./openApp";

export const EditorHost = () => {
  const { editor } = useEditor();
  if (editor === null) {
    return null;
  }
  switch (editor.kind) {
    case "custom_key":
      return <CustomKeyEditor editor={editor} />;
    case "macro":
      return <MacroEditor editor={editor} />;
    case "open_app":
      return <OpenAppEditor editor={editor} />;
    case "ball_scroll_activator":
      return <BallScrollActivatorEditor editor={editor} />;
    case "custom_combo_activator":
      return <ComboActivatorEditor editor={editor} />;
    default:
      return null;
  }
};
