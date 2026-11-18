# Do It Now

A small daily todo app. Pick a day, write a few tasks, tick them off. It runs entirely in the browser and keeps everything in local storage, so there is no account and no server.

[Live demo](https://todo-list-chi-fawn.vercel.app/)

## Screenshots

<img width="1000" height="904" alt="image" src="https://github.com/user-attachments/assets/b44ab14d-743a-4e54-b9ce-4f1fb915c591" />
<img width="368" height="832" alt="image" src="https://github.com/user-attachments/assets/65638614-ec33-449d-84ae-d7f2a28bd7cf" />
<img width="916" height="527" alt="image" src="https://github.com/user-attachments/assets/10633cc4-e698-44a8-a268-60cc60be3b0b" />
<img width="977" height="884" alt="image" src="https://github.com/user-attachments/assets/4a7eb2e3-8484-46d4-989b-bd8c7272942b" />



## Features

- One task list per day, with a strip of dates to switch between them
- Seven days of history and seven days ahead
- Past days are read-only, so finished work stays as it was
- Tasks older than seven days are deleted automatically
- Click a task to complete it, or use the pencil and bin buttons to edit and delete
- Progress bar with a short message that changes as you get through the list
- Small celebration when everything for the day is done (disabled if you prefer reduced motion)
- Works on phones, tablets and desktop


## How it works

Todos are stored in `localStorage` under the key `todos-by-day`, as an object keyed by date:

```json
{
  "2026-11-14": [
    { "id": "…", "text": "Write the README", "completed": false }
  ]
}
```

Dates use the local `YYYY-MM-DD` format, which sorts correctly as plain strings. That is what the pruning and the read-only check rely on.

On load, and again at midnight or when the tab becomes visible, any day older than the history window is removed. The window is set by `HISTORY_DAYS` in `src/store.js`, and the date strip reads the same constant, so the two cannot drift apart.


## Configuration

| Setting | Where | Default | What it does |
| --- | --- | --- | --- |
| `HISTORY_DAYS` | `src/store.js` | `7` | How many past days are kept and shown |
| Colours and fonts | `@theme` in `src/style.css` | see file | Palette and typography |

## AI USAGE

AI was used during the production mainly for debugging. Other than that it was used for color palette and animations.


## Author

Made by M. Huzaifa
