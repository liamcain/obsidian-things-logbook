import { App, Modal } from "obsidian";

interface IConfirmationDialogParams {
  cta: string;
  onAccept: (...args: unknown[]) => Promise<void>;
  onCancel?: (...args: unknown[]) => void;
  text: string;
  title: string;
}

export class ConfirmationModal extends Modal {
  constructor(app: App, config: IConfirmationDialogParams) {
    super(app);

    const { cta, onAccept, onCancel, text, title } = config;

    this.contentEl.createEl("h2", { text: title });
    this.contentEl.createEl("p", { text });
    this.contentEl
      .createEl("button", { text: "Never mind" })
      .addEventListener("click", (e) => {
        this.close();
        onCancel && onCancel(e);
      });

    this.contentEl
      .createEl("button", {
        cls: "mod-cta",
        text: cta,
      })
      .addEventListener("click", async (e) => {
        this.close();
        setTimeout(() => onAccept(e), 20);
      });
  }
}

export function createConfirmationDialog({
  cta,
  onAccept,
  onCancel,
  text,
  title,
}: IConfirmationDialogParams): ConfirmationModal {
  const modal = new ConfirmationModal(window.app, {
    cta,
    onAccept,
    onCancel,
    text,
    title,
  });
  modal.open();

  return modal;
}
