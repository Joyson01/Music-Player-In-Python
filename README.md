# Music Player in Python

A desktop music-player project built with Tkinter, Pygame, and Pillow. It includes playlist navigation, play/pause controls, MP3 importing, and an animated record image.

## Current setup limitation

The script loads images from `Images/`, but the repository currently stores them in `Imagees/`. A fresh checkout will need those paths aligned before the application can start. For a local trial, copy `Imagees/` to `Images/` in your working folder.

The application also uses an ICO window icon through Tkinter's `iconbitmap`; that behavior can vary by operating system.

## Setup and launch

Use Python 3 with Tkinter available and a desktop with audio support.

```bash
python -m pip install pygame pillow
python "Modify (Extra Project).py"
```

Launch from the repository folder after addressing the image-folder mismatch above. Tkinter is provided by the Python installation or the operating system, rather than by the packages in the command.

## Controls

| Action | Control |
| --- | --- |
| Play / pause | Space or play button |
| Previous track | Left arrow |
| Next track | Right arrow |
| Import MP3 files | Import button |
| Open a song search in the browser | YouTube button |

## Repository guide

- [Modify (Extra Project).py](Modify%20%28Extra%20Project%29.py): application entry point.
- `Imagees/`: interface images; see the path limitation above.
- `Songs/`: bundled audio.

## Credits

Made by J.A.VA (Joyson).

The songs used in this project do not belong to the author. Credit remains with the song artists.
