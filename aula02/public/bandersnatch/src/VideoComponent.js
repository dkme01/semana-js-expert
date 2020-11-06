class VideoComponent {
  constructor() {}

  initializePlayer() {
    // @ts-ignore
    const player = videojs("vid");
    // @ts-ignore
    const ModalDialog = videojs.getComponent("ModalDialog");
    const modal = new ModalDialog(player, {
      temporary: false,
      closeable: true,
    });

    player.addChild(modal);
  }
}
