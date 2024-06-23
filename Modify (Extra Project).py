import tkinter as tk
import webbrowser
from tkinter import PhotoImage
from tkinter import filedialog

import pygame
from PIL import Image, ImageTk

j = tk.Tk()
j.title("Modify (Definitely not Spotify)")
j.geometry("500x720")
j.resizable(width=False, height=False)
j.iconbitmap("Images/favicon.ico")

pygame.init()
pygame.mixer.init()

songs = [
    "Songs/Never Gonna Give You Up.mp3",
    "Songs/Dhoom Machale.mp3",
    "Songs/Macarena.mp3",
    "Songs/Soviet Connection.mp3",
    "Songs/Sunflower.mp3",
    "Songs/Still D.R.E..mp3",
    "Songs/Welcome To Los Santos.mp3"
]

track = 0
paused = True
track_pos = 0


def disk_animation(angle=0):
    if not paused:
        angle += 1
        angle %= 360
        rotated_image = music_disk_img.rotate(angle)
        music_disk = ImageTk.PhotoImage(rotated_image)
        music_disk_label.configure(image=music_disk)
        music_disk_label.image = music_disk
    j.after(10, disk_animation, angle)


disk_animation()


def play_current_song():
    global paused, track_pos
    pygame.mixer.music.load(songs[track])
    pygame.mixer.music.play(start=track_pos / 1000.0)
    paused = False
    play.config(image=pause_img)
    update_song_label()


def toggle_music(event=None):
    global paused, track_pos
    if paused:
        if track_pos == 0:
            play_current_song()
        else:
            pygame.mixer.music.unpause()
            paused = False
            play.config(image=pause_img)
    else:
        pygame.mixer.music.pause()
        paused = True
        track_pos = pygame.mixer.music.get_pos()  # Store current position
        play.config(image=play_img)


def update_song_label():
    song_name = songs[track].split("/")[-1].replace(".mp3", "")
    lab1.config(text=song_name)


def next_song(event=None):
    global track, track_pos
    track = (track + 1) % len(songs)
    track_pos = 0
    play_current_song()


def prev_song(event=None):
    global track, track_pos
    track = (track - 1) % len(songs)
    track_pos = 0
    play_current_song()


def import_songs():
    global songs, track, track_pos
    file_paths = filedialog.askopenfilenames(filetypes=[("MP3 files", "*.mp3")])
    if file_paths:
        songs.extend(file_paths)
        track = len(songs) - len(file_paths)  # Set track to the first newly added song
        track_pos = 0
        play_current_song()


def more_song():
    url = "https://www.youtube.com/results?search_query=Songs"
    webbrowser.open(url)


play_img = PhotoImage(file="Images/play.png")
pause_img = PhotoImage(file="Images/pause.png")
next_img = PhotoImage(file="Images/next.png")
prev_img = PhotoImage(file="Images/previous.png")
import_img = PhotoImage(file="Images/imp.png")
music_disk_img = Image.open("Images/disk.png")
log_img = PhotoImage(file="Images/logo.png")
yt_img = PhotoImage(file="Images/yt.png")
exit_img = PhotoImage(file="Images/exit.png")
music_disk = ImageTk.PhotoImage(music_disk_img)

logo = tk.Label(j, image=log_img, bd=0)
logo.place(x=0, y=0)

music_disk_label = tk.Label(j, image=music_disk)
music_disk_label.place(x=250, y=230, anchor=tk.CENTER)

lab1 = tk.Label(j, text="", font=("Arial", 24, "bold"), fg="white", bg="green", pady=10)
lab1.place(x=250, y=430, anchor=tk.CENTER)

play = tk.Button(j, image=play_img, command=toggle_music, bd=0)
play.place(x=250, y=530, anchor=tk.CENTER)

next_button = tk.Button(j, image=next_img, command=next_song, bd=0)
next_button.place(x=400, y=530, anchor=tk.CENTER)

prev_button = tk.Button(j, image=prev_img, command=prev_song, bd=0)
prev_button.place(x=100, y=530, anchor=tk.CENTER)

import_button = tk.Button(j, image=import_img, command=import_songs, bd=0)
import_button.place(x=250, y=660, anchor=tk.CENTER)

more_button = tk.Button(j, image=yt_img, command=more_song, bd=0)
more_button.place(x=80, y=660, anchor=tk.CENTER)

exit_button = tk.Button(j, image=exit_img, command=j.destroy, bd=0)
exit_button.place(x=420, y=660, anchor=tk.CENTER)

copyright_label = tk.Label(j, text="© 2024 (J.A.VA) Joyson Vadlya . All rights reserved.", fg="gray", font=("Arial", 8))
copyright_label.place(x=10, y=700)

update_song_label()

j.bind('<space>', toggle_music)
j.bind('<Left>', prev_song)
j.bind('<Right>', next_song)

j.mainloop()
