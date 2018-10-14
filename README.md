# Fake Dialogs Editor (FDE) 🗪
Utility programm for create/edit fake dialog JSON schemes

## Example dialog JSON schema
`userIndex` - index from array with users

`replyMessageIndex` - index reply message from current dialog array

`text` - message text

```json
[
   [
      {
         "userIndex":0,
         "text":"Hello"
      },
      {
         "userIndex":1,
         "replyMessageIndex":0,
         "text":"Hi"
      },
      {
         "userIndex":0,
         "replyMessageIndex":1,
         "text":"How are you?"
      },
      {
         "userIndex":1,
         "replyMessageIndex":2,
         "text":"All right"
      },
      {
         "userIndex":1,
         "replyMessageIndex":2,
         "text":"Good bye"
      }
   ],
   [
      {
         "userIndex":2,
         "text":"GG"
      },
      {
         "userIndex":3,
         "replyMessageIndex":0,
         "text":"WP"
      }
   ]
]
```

## Example users JSON schema
`name` - user name

`image` - image url

```json
[
  {
    "name":"WorldEdit",
    "image":"https://.../avatar.jpg"
  },
  {
    "name":"Forg",
    "image":"https://.../avatar.jpg"
  }
]
```
