import React, { useState, useRef, useEffect } from "react";
import "./AudioRecorder.css";

const AudioRecorder = () => {
  const [mode, setMode] = useState("audio");
  const [recording, setRecording] = useState(false);
  const [mediaUrl, setMediaUrl] = useState(null);
  const [timer, setTimer] = useState(0);
  const [error, setError] = useState("");
  const [list, setList] = useState([]);

  const mediaRef = useRef(null);
  const media = useRef([]);
  const trackRef = useRef(null);
  const videoRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("recordings") || "[]");
    setList(saved);
  }, []);

  const formatTime = (sec) => {
    const m = String(Math.floor(sec / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  const startTimer = () => {
    setTimer(0);
    timerRef.current = setInterval(() => setTimer((prev) => prev + 1), 1000);
  };

  const stopTimer = () => clearInterval(timerRef?.current);

  const startRecording = async () => {
    try {
      const modeType = mode === "video"
        ? { video: true, audio: true }
        : { audio: true };

      const track = await navigator.mediaDevices.getUserMedia(modeType);
      trackRef.current = track;

      if (mode === "video") {
        videoRef.current.srcObject = track;
      }

      mediaRef.current = new MediaRecorder(track);
      media.current = [];

      mediaRef.current.ondataavailable = (e) =>
        media.current.push(e.data);

      mediaRef.current.onstop = () => {
        const blob = new Blob(media.current, {
          type: mode === "video" ? "video/webm" : "audio/webm",
        });
        const url = URL.createObjectURL(blob);
        setMediaUrl(url);

        const newList = [
          ...list,
          { url, type: mode, date: new Date().toLocaleString() },
        ];
        setList(newList);
        // localStorage.setItem("recordings", JSON.stringify(newList));
      };

      mediaRef.current.start();
      setError("");
      setRecording(true);
      startTimer();
    } catch (err) {
      setError("Mic or Camera access denied.");
    }
  };

  const stopRecording = () => {
    mediaRef.current.stop();
    trackRef.current.getTracks().forEach((track) => track.stop());
    setRecording(false);
    stopTimer();
  };

  const download = () => {
    const a = document.createElement("a");
    a.href = mediaUrl;
    a.download = `${mode}-recording.webm`;
    a.click();
  };

  return (
    <div className="recorder-container">
      <h1>🎙️ Audio & Video Recorder</h1>
      <div className="toggle-btn">
        <label>
          <input
            type="radio"
            value="audio"
            checked={mode === "audio"}
            onChange={() => setMode("audio")}
            disabled={recording}
          />
          Audio
        </label>
        <label>
          <input
            type="radio"
            value="video"
            checked={mode === "video"}
            onChange={() => setMode("video")}
            disabled={recording}
          />
          Video
        </label>
      </div>

      {mode === "video" && (
        <video
          ref={videoRef}
          autoPlay
          muted
          className={`videopreview ${recording ? "visible" : "hidden"}`}
        />
      )}

      <div className="start-stop-btn">
        {!recording ? (
          <button onClick={startRecording} className="start-btn">Start</button>
        ) : (
          <button onClick={stopRecording} className="stop-btn">Stop</button>
        )}
        {recording && <span className="timer">⏱ {formatTime(timer)}</span>}
      </div>

      {error && (
        <div className="error">{error}</div>
      )}

      {mediaUrl && (
        <div className="preview-section">
          <h3>📤 Preview & Download</h3>
          {/* <div className="preview-row"> */}

          {mode === "audio" ? (
            <audio controls src={mediaUrl}></audio>
          ) : (
            <video controls src={mediaUrl} className="preview" />
          )}
          <button onClick={download} className="download-btn">Download</button>
             
          {/* </div> */}
        </div>
      )}

      <div className="previous-recordings">
        <h3>📁 Saved Recordings</h3>
        {list.length === 0 && <p>No previous recordings.</p>}
        {list.map((data, idx) => (
          <div key={idx} className="recording-item">
            <p><strong>{data?.type.toUpperCase()}</strong> - {data.date}</p>
            {data?.type === "audio" ? (
              <audio controls src={data?.url}></audio>
            ) : (
              <video controls src={data?.url} className="small-video" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AudioRecorder;


