class VideoMediaPlayer {
  constructor({ manifestJSON, network }) {
    this.manifestJSON = manifestJSON;
    this.network = network;

    this.videoElement = null;
    this.sourceBuffer = null;

    this.selected = {};
    this.videoDuration = 0;
  }

  initializeCodec() {
    this.videoElement = document.getElementById("vid");

    const mediaSourceSupported = !!window.MediaSource;

    if (!mediaSourceSupported) {
      alert("Seu browser ou sistema não tem suporte a MSE!");
      return;
    }

    const codecSupported = MediaSource.isTypeSupported(this.manifestJSON.codec);

    if (!codecSupported) {
      alert(`Seu browser não suporta o codec: ${this.manifestJSON.codec}`);
      return;
    }

    const mediaSource = new MediaSource();

    // @ts-ignore
    this.videoElement.src = URL.createObjectURL(mediaSource);

    mediaSource.addEventListener("sourceopen", this.sourceOpenWrapper(mediaSource));
  }

  sourceOpenWrapper(mediaSource) {
    return async () => {
      this.sourceBuffer = mediaSource.addSourceBuffer(this.manifestJSON.codec);
      const selected = (this.selected = this.manifestJSON.intro);
      // evita rodar como LIVE
      mediaSource.duration = this.videoDuration;
      await this.fileDownload(selected.url);
    };
  }

  async fileDownload(url) {
    const prepareUrl = {
      url,
      fileResolution: 360,
      fileResolutionTag: this.manifestJSON.fileResolutionTag,
      hostTag: this.manifestJSON.hostTag,
    };

    const finalUrl = this.network.parseManifestUrl(prepareUrl);

    this.setVideoPlayerDuration(finalUrl);

    const data = await this.network.fetchFile(finalUrl);

    return this.processBufferSegments(data);
  }

  setVideoPlayerDuration(finalUrl) {
    const bars = finalUrl.split("/");
    const [name, videoDuration] = bars[bars.length - 1].split("-");

    this.videoDuration += videoDuration;
  }

  async processBufferSegments(allSegments) {
    const sourceBuffer = this.sourceBuffer;

    sourceBuffer.appendBuffer(allSegments);

    return new Promise((resolve, reject) => {
      const updateEnd = () => {
        sourceBuffer.removeEventListener("updateend", updateEnd);
        sourceBuffer.timeStampOffset = this.videoDuration;

        return resolve();
      };

      sourceBuffer.addEventListener("updateend", updateEnd);

      sourceBuffer.addEventListener("error", reject);
    });
  }
}
