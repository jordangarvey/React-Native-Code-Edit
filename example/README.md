# Example app

An Expo app for trying the editor on a simulator or a device.

Because the library is pure JavaScript with no native modules, this needs no
`pod install` and no prebuild — it runs in Expo Go as-is.

```sh
npm install          # in the repository root, which also builds dist/
cd example
npm install
npm run ios          # or: npm run android, or npm start
```

The app resolves the library from `..` rather than from npm, so changes to
`src/` show up after a rebuild in the root (`npm run build`).

## What to look at

Each language sample opens with the cases that were highlighted incorrectly
before 1.0.0, so they can be checked at a glance:

- a URL inside a string, which used to comment out the rest of the line
- a keyword inside a string, which used to be coloured
- a block comment, which used to go unrecognised
- a number, which used to go unhighlighted

Three things can only really be judged on a device, and are worth a moment:

- **Caret alignment.** Type at the end of a long line and near the bottom of the
  file. The caret lives in one layer and the colour in the other, so any
  disagreement between them shows up as drift.
- **Caret visibility.** Toggle to the dark theme. The input's own text is
  transparent, so the caret is drawn in the theme's colour.
- **Scrolling and the keyboard**, particularly with the keyboard raised.
