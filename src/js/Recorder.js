import React, { Component } from 'react';
import PropTypes from 'prop-types';

class Recorder extends Component {
  constructor(props) {
    super(props);
    this.state = {
      streams: [],
      isSupported: false,
      isRecording: false,
    };

    this.mediaRecorder = false;
    this.audioCtx = new (window.AudioContext || webkitAudioContext)();
    this.canvasCtx = false;
    this.chunks = [];
  }

  componentDidMount() {
    this.canvasCtx = this.refs.canvas.getContext('2d');

    if (navigator.mediaDevices.getUserMedia) {
      console.log('getUserMedia supported.');
      this.setState({
        isSupported: true,
      });

      const constraints = { audio: true };
      const onError = function (err) {
        console.log(`The following error occured: ${err}`);
      };

      navigator.mediaDevices.getUserMedia(constraints).then((stream) => { this.onSuccess(stream); }, onError);

      window.onresize = () => {
        this.refs.canvas.width = this.refs.main.offsetWidth;
      };

      window.onresize();
    }
  }

  onSuccess(stream) {
    this.mediaRecorder = new MediaRecorder(stream);
    this.visualizeStream(stream);

    this.mediaRecorder.onstop = (e) => {
      const a = document.createElement('a');
      document.body.appendChild(a);

      const blob = new Blob(this.chunks, { type: 'audio/webm; codecs=opus' });
      // const blob = new Blob(this.chunks, { type: 'application/octet-stream' });
      this.chunks = []; const audioURL = window.URL.createObjectURL(blob);
      a.href = audioURL;
      a.download = 'test_audio.webm';
      a.click();
    };

    this.mediaRecorder.ondataavailable = (e) => {
      this.chunks.push(e.data);
    };
  }

  visualizeStream(stream) {
    const source = this.audioCtx.createMediaStreamSource(stream);

    const analyser = this.audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    source.connect(analyser);
    // analyser.connect(audioCtx.destination);

    const draw = () => {
      const WIDTH = this.refs.canvas.width;
      const HEIGHT = this.refs.canvas.height;

      requestAnimationFrame(draw);

      analyser.getByteTimeDomainData(dataArray);

      this.canvasCtx.fillStyle = 'rgb(200, 200, 200)';
      this.canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);


      this.canvasCtx.lineWidth = 2;
      this.canvasCtx.strokeStyle = 'rgb(0, 0, 0)';

      this.canvasCtx.beginPath();

      const sliceWidth = WIDTH * 1.0 / bufferLength;
      let x = 0;


      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * HEIGHT / 2;

        if (i === 0) {
          this.canvasCtx.moveTo(x, y);
        } else {
          this.canvasCtx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      this.canvasCtx.lineTo(this.refs.canvas.width, this.refs.canvas.height / 2);
      this.canvasCtx.stroke();
    };

    draw();
  }

  toggleRecord() {
    if (this.state.isRecording) {
      this.stopRecord();
    } else {
      this.startRecord();
    }

    this.setState({
      isRecording: !this.state.isRecording,
    });
  }

  startRecord() {
    if (this.state.isSupported) {
      this.mediaRecorder.start();
      this.refs.record.style.background = 'red';
    }
  }

  stopRecord() {
    if (this.state.isSupported) {
      this.mediaRecorder.stop();
      this.refs.record.style.background = '';
      this.refs.record.style.color = '';
      // mediaRecorder.requestData();
    }
  }

  render() {
    return (
      <section ref="main" className={this.props.className}>
        <video ref="video" src="" />
        <canvas ref="canvas" className="visualizer" height="60px" />
        <div id="buttons">
          <button
            ref="record"
            className="record"
            onClick={() => {
              this.toggleRecord();
            }}
          >
            { !this.state.isRecording ? 'Record' : 'Stop' }
          </button>
        </div>
      </section>
    );
  }
}

Recorder.propTypes = {
  className: PropTypes.string.isRequired,
};

export default Recorder;
