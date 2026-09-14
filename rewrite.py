import sys

msg = sys.stdin.read()

replacements = {
    "Merge updated saker branch and remove javascript references as per previous instructions": "merge saker codes and fix js",
    "Replace placeholders with Ratul and update review names to Ratul, Saker, Sami": "update names and reviews",
    "Restore chat.css and add Chat link to all public navigation headers": "add chat option to header",
    "Update admin nav and add admin stats page, move KDS link to chef nav, add logout to chef header": "update admin and chef dashboard",
    "Remove JS, use pure HTML/CSS for role routing, merge sami branch, hardcode roles/logout in headers": "remove js and merge sami pages",
    "Merge sami branch into development, accept theirs for formatting changes": "merge sami branch",
    "Remove auth.js and references as requested to use pure HTML/CSS": "remove auth script",
    "Fix script injection formatting": "fix html format",
    "Add auth.js for role display and logout, update login routing for chef": "add role display and login redirect"
}

for old_text, new_text in replacements.items():
    if old_text in msg:
        msg = msg.replace(old_text, new_text)

sys.stdout.write(msg)
