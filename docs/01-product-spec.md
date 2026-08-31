# 01 — Product spec

## One line

Rate the elevator you're standing in; get back an official-looking inspection
certificate you want to post.

## The mechanic

Rating is four taps, not a form. Four sub-scores, 1–5 each:

| Sub-score | Question shown to the user |
|---|---|
| Smooth | How's the ride? |
| Speedy | How long did you wait? |
| Spotless | What shape is the car in? |
| Character | Anything weird about it? |

Overall score = mean, rounded to the nearest half point. The user then types up to
two lines of remarks (48 chars each) — this is where the personality lives and the
main reason anyone shares the result.

Certificate renders immediately. Share sheet exports 1080×1080.

## v1 scope — ships

- Anonymous browse; account required to rate
- Find elevator: nearby (GPS), search by building, or scan/enter a building address
- Add an elevator to a building (name/label, floors, manufacturer if known)
- Rate flow → certificate → share
- Elevator page: current score, certificate history, photos
- Building page: all elevators, building average
- Profile: your certificates, your stats ("47 elevators inspected")
- Report content / block user (compliance)
- In-app account deletion (compliance)
- Web: same app + public certificate permalinks with OG images

## v1 scope — explicitly not

- Comments and threads (moderation load, no payoff at launch)
- Follows and social graph
- Leaderboards (invite gaming before there's enough data)
- Elevator manufacturer verification
- Push notifications

## Why people come back

The CONDEMNED certificate. Nobody screenshots a 4.5. They screenshot the 1.2 for
the freight elevator at work. Make that variant visually distinct and easy to share,
and it does the acquisition work.

## Success signals for v1

| Metric | Target at 90 days |
|---|---|
| Certificates created per active user per week | ≥ 2 |
| Share rate (share sheet opened / certificates created) | ≥ 25% |
| Elevators with ≥ 2 independent ratings | ≥ 15% |
| Day-30 retention | ≥ 12% |

Share rate is the one that matters. If it's under 15%, the certificate isn't funny
enough — fix the remarks UX before building anything else.
