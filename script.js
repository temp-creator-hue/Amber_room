// Amber Room Audio - waveform decoration + player + booking form
// drop mp3 files in /audio and match the paths below to hear playback

window.onload = function () {
  build_wave();
  setup_player();
  setup_booking_form();
};

// ------------------------------
// hero waveform bars (just decoration)
// ------------------------------
function build_wave() {
  var group = document.getElementById("wave_bars");
  if (!group) return;

  var bar_count = 40;
  var svg_width = 320;
  var bar_width = svg_width / bar_count;

  for (var i = 0; i < bar_count; i++) {
    var height = 20 + Math.abs(Math.sin(i * 0.5)) * 100 + Math.random() * 30;
    var rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", i * bar_width + 1);
    rect.setAttribute("y", (180 - height) / 2);
    rect.setAttribute("width", bar_width - 2);
    rect.setAttribute("height", height);
    group.appendChild(rect);
  }
}

// ------------------------------
// track data
// ------------------------------
var tracks = [
  { trackName: "Low Tide", artist: "Marina Cole", audioFilePath: "audio/low-tide.mp3", length: "3:42" },
  { trackName: "Static Bloom", artist: "Fenwick & Rae", audioFilePath: "audio/static-bloom.mp3", length: "4:05" },
  { trackName: "Corner Booth", artist: "The Quiet Version", audioFilePath: "audio/corner-booth.mp3", length: "2:58" },
  { trackName: "Session 14, Take 2", artist: "Del Osei", audioFilePath: "audio/session-14-take-2.mp3", length: "3:16" }
];

var audio = new Audio();
var current_index = 0;
var is_seeking = false;

// ------------------------------
// player
// ------------------------------
function setup_player() {

  var track_list_el = document.getElementById("track_list");
  var now_track_el = document.getElementById("now_track");
  var now_artist_el = document.getElementById("now_artist");
  var cover_initials_el = document.getElementById("cover_initials");
  var seek_el = document.getElementById("seek");
  var time_current_el = document.getElementById("time_current");
  var time_total_el = document.getElementById("time_total");
  var btn_play = document.getElementById("btn_play");
  var btn_prev = document.getElementById("btn_prev");
  var btn_next = document.getElementById("btn_next");
  var icon_play = document.getElementById("icon_play");
  var icon_pause = document.getElementById("icon_pause");
  var volume_el = document.getElementById("volume");

  // remember volume + last track from localStorage
  var saved_volume = localStorage.getItem("amberRoomVolume");
  var saved_index = localStorage.getItem("amberRoomTrackIndex");

  if (saved_volume !== null) {
    audio.volume = saved_volume / 100;
    volume_el.value = saved_volume;
  } else {
    audio.volume = 0.8;
  }

  if (saved_index !== null && tracks[saved_index]) {
    current_index = Number(saved_index);
  }

  function render_track_list() {
    track_list_el.innerHTML = "";

    for (var i = 0; i < tracks.length; i++) {
      var li = document.createElement("li");
      li.innerHTML = (i + 1) + ". " + tracks[i].trackName + " - " + tracks[i].artist +
        " <span style='float:right'>" + tracks[i].length + "</span>";

      (function (index) {
        li.onclick = function () {
          load_track(index, true);
        };
      })(i);

      track_list_el.appendChild(li);
    }

    highlight_active_row();
  }

  function highlight_active_row() {
    var rows = track_list_el.children;
    for (var i = 0; i < rows.length; i++) {
      rows[i].className = (i === current_index) ? "active" : "";
    }
  }

  function load_track(index, autoplay) {
    current_index = index;
    var track = tracks[index];

    now_track_el.innerHTML = track.trackName;
    now_artist_el.innerHTML = track.artist;
    cover_initials_el.innerHTML = track.trackName.substring(0, 2).toUpperCase();

    audio.src = track.audioFilePath;
    seek_el.value = 0;
    time_current_el.innerHTML = "0:00";
    time_total_el.innerHTML = "0:00";

    localStorage.setItem("amberRoomTrackIndex", index);
    highlight_active_row();

    if (autoplay) {
      play_audio();
    }
  }

  function play_audio() {
    audio.play().catch(function () {
      now_artist_el.innerHTML = "add this file under /audio to hear it play";
    });
    icon_play.hidden = true;
    icon_pause.hidden = false;
  }

  function pause_audio() {
    audio.pause();
    icon_play.hidden = false;
    icon_pause.hidden = true;
  }

  function format_time(seconds) {
    if (!isFinite(seconds)) return "0:00";
    var m = Math.floor(seconds / 60);
    var s = Math.floor(seconds % 60);
    if (s < 10) s = "0" + s;
    return m + ":" + s;
  }

  btn_play.onclick = function () {
    if (!audio.src) {
      load_track(current_index, false);
    }
    if (audio.paused) {
      play_audio();
    } else {
      pause_audio();
    }
  };

  btn_prev.onclick = function () {
    var next_index = current_index - 1;
    if (next_index < 0) next_index = tracks.length - 1;
    load_track(next_index, true);
  };

  btn_next.onclick = function () {
    var next_index = current_index + 1;
    if (next_index >= tracks.length) next_index = 0;
    load_track(next_index, true);
  };

  audio.addEventListener("loadedmetadata", function () {
    seek_el.max = audio.duration;
    time_total_el.innerHTML = format_time(audio.duration);
  });

  audio.addEventListener("timeupdate", function () {
    if (is_seeking) return;
    seek_el.value = audio.currentTime;
    time_current_el.innerHTML = format_time(audio.currentTime);
  });

  audio.addEventListener("ended", function () {
    btn_next.onclick();
  });

  seek_el.oninput = function () {
    is_seeking = true;
    time_current_el.innerHTML = format_time(seek_el.value);
  };

  seek_el.onchange = function () {
    audio.currentTime = seek_el.value;
    is_seeking = false;
  };

  volume_el.oninput = function () {
    audio.volume = volume_el.value / 100;
    localStorage.setItem("amberRoomVolume", volume_el.value);
  };

  render_track_list();
  load_track(current_index, false);
}

// ------------------------------
// booking form validation
// ------------------------------
function setup_booking_form() {
  var booking_form = document.getElementById("booking_form");
  if (!booking_form) return;

  booking_form.onsubmit = function (e) {
    e.preventDefault();

    var ok = true;

    var name = document.getElementById("f_name").value.trim();
    if (name === "") {
      document.getElementById("err_name").innerHTML = "enter your name";
      ok = false;
    } else {
      document.getElementById("err_name").innerHTML = "";
    }

    var email = document.getElementById("f_email").value.trim();
    var email_pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email === "") {
      document.getElementById("err_email").innerHTML = "enter your email";
      ok = false;
    } else if (!email_pattern.test(email)) {
      document.getElementById("err_email").innerHTML = "enter a valid email";
      ok = false;
    } else {
      document.getElementById("err_email").innerHTML = "";
    }

    var project = document.getElementById("f_project").value;
    if (project === "") {
      document.getElementById("err_project").innerHTML = "choose a project type";
      ok = false;
    } else {
      document.getElementById("err_project").innerHTML = "";
    }

    var message = document.getElementById("f_message").value.trim();
    if (message === "") {
      document.getElementById("err_message").innerHTML = "tell us about the project";
      ok = false;
    } else {
      document.getElementById("err_message").innerHTML = "";
    }

    var status_el = document.getElementById("form_status");

    if (!ok) {
      status_el.innerHTML = "fix the fields above and try again";
      status_el.style.color = "#e0876b";
      return;
    }

    status_el.innerHTML = "thanks - we'll follow up within a day";
    status_el.style.color = "#6e8f70";
    booking_form.reset();
  };
}
