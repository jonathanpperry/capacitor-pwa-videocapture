import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  ViewChild,
} from "@angular/core";
import { VideoService } from "../services/video.service";

import { Capacitor, Plugins } from "@capacitor/core";
import * as WebVPPlugin from "capacitor-video-player";
const { CapacitorVideoPlayer } = Plugins;

@Component({
  selector: "app-home",
  templateUrl: "home.page.html",
  styleUrls: ["home.page.scss"],
})
export class HomePage implements AfterViewInit {
  mediaRecorder: MediaRecorder;
  videoPlayer: any;
  isRecording = false;
  videos = [];
  @ViewChild("video") captureElement: ElementRef;
  constructor(
    private videoService: VideoService,
    private changeDetector: ChangeDetectorRef
  ) {}

  async ngAfterViewInit() {
    this.videos = await this.videoService.loadVideos();
    // Initialize the video player plugin
    if (Capacitor.isNative) {
      this.videoPlayer = CapacitorVideoPlayer;
    } else {
      this.videoPlayer = WebVPPlugin.CapacitorVideoPlayer;
    }
  }

  async recordVideo() {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user",
      },
      audio: true,
    });
    this.captureElement.nativeElement.srcObject = stream;
    // Set recording boolean
    this.isRecording = true;
    const options = { mimeType: "video/webm" };
    this.mediaRecorder = new MediaRecorder(stream, options);
    let chunks = [];

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunks.push(event.data);
      }
    };
    this.mediaRecorder.onstop = async (event) => {
      const videoBuffer = new Blob(chunks, { type: "video/webm" });
      // Store the video
      await this.videoService.storeVideo(videoBuffer);

      // reload the list
      this.videos = this.videoService.videos;
      this.changeDetector.detectChanges();
    };
  }

  stopRecord() {
    this.mediaRecorder.stop();
    this.mediaRecorder = null;
    this.captureElement.nativeElement.srcObject = null;
    this.isRecording = false;
  }

  async play(video) {
    const base64data = await this.videoService.getVideoUrl(video);

    // Show the player fullscreen
    await this.videoPlayer.initPlayer({
      mode: "fullscreen",
      url: base64data,
      playerId: "fullscreen",
      componentTag: "app-home",
    });
  }
}
