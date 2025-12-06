const express = require("express");
const app = express();
const db = require("./db");
const path = require("path");

app.use(express.json());
app.use(express.static("public"));


// ---------------- API ----------------

// آخرین سانس
app.get("/api/latest-session", (req, res) => {
    db.get("SELECT * FROM sessions ORDER BY id DESC LIMIT 1", [], (err, row) => {
        if (err) return res.json({});
        res.json(row || {});
    });
});


// دریافت بازیکنان (POST + session_id)
app.post("/api/players", (req, res) => {
    const { session_id } = req.body;

    db.all(
        "SELECT * FROM players WHERE session_id = ? ORDER BY id ASC",
        [session_id],
        (err, rows) => {
            if (err) return res.json([]);
            res.json(rows);
        }
    );
});


// اضافه کردن بازیکن (با محدودیت ظرفیت 12 نفر)
app.post("/api/add-player", (req, res) => {
    const { session_id, player_name } = req.body;

    if (!player_name || !session_id)
        return res.json({ ok: false, msg: "missing data" });

    // مرحله 1: شمارش تعداد بازیکنان فعلی این سانس
    db.get(
        "SELECT COUNT(*) AS count FROM players WHERE session_id = ?",
        [session_id],
        (err, row) => {
            if (err) return res.json({ ok: false });

            // اگر ظرفیت پر باشد
            if (row.count >= 12) {
                return res.json({ ok: false, msg: "full" });
            }

            // مرحله 2: افزودن بازیکن
            db.run(
                "INSERT INTO players (session_id, player_name) VALUES (?, ?)",
                [session_id, player_name],
                (err) => {
                    if (err) return res.json({ ok: false });
                    res.json({ ok: true });
                }
            );
        }
    );
});


// حذف بازیکن
app.post("/api/remove-player", (req, res) => {
    const { id } = req.body;

    db.run("DELETE FROM players WHERE id = ?", [id], (err) => {
        if (err) return res.json({ ok: false });
        res.json({ ok: true });
    });
});


// ذخیره سانس جدید
app.post("/api/save-session", (req, res) => {
    const { day, time, place, location } = req.body;

    db.run(
        "INSERT INTO sessions (day, time, place, location) VALUES (?,?,?,?)",
        [day, time, place, location],
        (err) => {
            if (err) return res.json({ ok: false });
            res.json({ ok: true });
        }
    );
});



app.post("/api/clear-players", (req, res) => {
    db.run("DELETE FROM players", err => {
        if (err) return res.json({ ok: false, error: err });
        res.json({ ok: true, msg: "players table cleared" });
    });
});


// --------------------------------------------------

app.listen(3000, () => console.log("Server running on port 3000"));