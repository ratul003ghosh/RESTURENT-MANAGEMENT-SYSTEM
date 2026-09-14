import sys

msg = sys.stdin.read()

replacements = {
    "Merge updated saker branch and remove javascript references as per previous instructions": "merge saker branch and fix conflicts",
    "Replace placeholders with Ratul and update review names to Ratul, Saker, Sami": "update names in pages and reviews",
    "Restore chat.css and add Chat link to all public navigation headers": "fix chat css and add chat to nav",
    "Update admin nav and add admin stats page, move KDS link to chef nav, add logout to chef header": "update admin and chef dashboards",
    "Remove JS, use pure HTML/CSS for role routing, merge sami branch, hardcode roles/logout in headers": "switch to html routing and merge sami",
    "Merge sami branch into development, accept theirs for formatting changes": "merge sami formatting",
    "Remove auth.js and references as requested to use pure HTML/CSS": "remove auth.js",
    "Fix script injection formatting": "fix html script tag format",
    "Add auth.js for role display and logout, update login routing for chef": "add auth.js for role display",
    "Merge branch 'saker' into development": "merge saker branch"
}

for k, v in replacements.items():
    if k in msg:
        msg = msg.replace(k, v)

sys.stdout.write(msg)
