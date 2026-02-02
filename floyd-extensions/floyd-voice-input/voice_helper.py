#!/usr/bin/env python3
"""
Voice input helper for FLOYD - triggers macOS microphone permission dialog
"""
import sys
import json
import time

def request_microphone_permission():
    """
    Attempt to access the microphone - this will trigger macOS permission dialog
    """
    try:
        import pyaudio
        
        # Initialize PyAudio - this triggers the macOS permission prompt
        p = pyaudio.PyAudio()
        
        # Try to open a stream - this is what actually needs mic access
        stream = p.open(
            format=pyaudio.paInt16,
            channels=1,
            rate=16000,
            input=True,
            frames_per_buffer=1024
        )
        
        print(json.dumps({"status": "permission_granted", "executable": sys.executable}))
        sys.stdout.flush()
        
        # Close the stream
        stream.stop_stream()
        stream.close()
        p.terminate()
        
        return True
        
    except Exception as e:
        error_msg = str(e)
        if "denied" in error_msg.lower() or "permission" in error_msg.lower():
            print(json.dumps({"status": "permission_denied", "error": str(e), "executable": sys.executable}))
        else:
            print(json.dumps({"status": "error", "error": str(e), "executable": sys.executable}))
        sys.stdout.flush()
        return False

def record_audio(duration=5):
    """
    Record audio from microphone
    """
    try:
        import pyaudio
        import wave
        import tempfile
        import os
        
        CHUNK = 1024
        FORMAT = pyaudio.paInt16
        CHANNELS = 1
        RATE = 16000
        
        p = pyaudio.PyAudio()
        
        stream = p.open(
            format=FORMAT,
            channels=CHANNELS,
            rate=RATE,
            input=True,
            frames_per_buffer=CHUNK
        )
        
        print(json.dumps({"status": "recording"}))
        sys.stdout.flush()
        
        frames = []
        for _ in range(0, int(RATE / CHUNK * duration)):
            data = stream.read(CHUNK)
            frames.append(data)
        
        stream.stop_stream()
        stream.close()
        p.terminate()
        
        # Save to temporary file
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
        wf = wave.open(temp_file.name, 'wb')
        wf.setnchannels(CHANNELS)
        wf.setsampwidth(p.get_sample_size(FORMAT))
        wf.setframerate(RATE)
        wf.writeframes(b''.join(frames))
        wf.close()
        
        print(json.dumps({"status": "recorded", "file": temp_file.name}))
        sys.stdout.flush()
        
        return temp_file.name
        
    except Exception as e:
        error_msg = str(e)
        if "denied" in error_msg.lower() or "permission" in error_msg.lower():
            print(json.dumps({"status": "permission_denied", "error": str(e), "executable": sys.executable}))
        else:
            print(json.dumps({"status": "error", "error": str(e), "executable": sys.executable}))
        sys.stdout.flush()
        return None

def transcribe_audio(audio_file, language="en-US"):
    """
    Transcribe audio using speech recognition
    """
    try:
        import speech_recognition as sr
        
        recognizer = sr.Recognizer()
        
        with sr.AudioFile(audio_file) as source:
            audio = recognizer.record(source)
        
        # Use Google Speech Recognition (requires internet)
        text = recognizer.recognize_google(audio, language=language)
        
        print(json.dumps({"status": "transcribed", "text": text, "executable": sys.executable}))
        sys.stdout.flush()
        
        return text
        
    except sr.UnknownValueError:
        print(json.dumps({"status": "no_speech", "error": "Could not understand audio", "executable": sys.executable}))
        sys.stdout.flush()
        return None
    except sr.RequestError as e:
        print(json.dumps({"status": "error", "error": f"Recognition service error: {e}", "executable": sys.executable}))
        sys.stdout.flush()
        return None
    except Exception as e:
        print(json.dumps({"status": "error", "error": str(e), "executable": sys.executable}))
        sys.stdout.flush()
        return None

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"status": "error", "error": "No command specified"}))
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == "check_permission":
        request_microphone_permission()
    
    elif command == "record":
        duration = int(sys.argv[2]) if len(sys.argv) > 2 else 5
        audio_file = record_audio(duration)
        
        if audio_file and len(sys.argv) > 3:
            language = sys.argv[3]
            transcribe_audio(audio_file, language)
    
    elif command == "install_deps":
        print(json.dumps({"status": "installing", "message": "Install PyAudio and SpeechRecognition"}))
        sys.stdout.flush()
    
    else:
        print(json.dumps({"status": "error", "error": f"Unknown command: {command}"}))

if __name__ == "__main__":
    main()
