import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
    credentials: true,
  })
);

const canon = (s) =>
  String(s || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");

// ─── CONFIG (no dotenv) ───────────────────────────────────────────────────────
const PORT = 5000;
const MONGO_URI = "mongodb+srv://maheemshahreear2:r3iZJpAcyefauKSV@cluster0.op4beda.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const JWT_SECRET = "school_super_secret_jwt_key_2024";
const ADMIN_PASSWORD = "admin123"; // Change this in production

// ─── CONNECT TO MONGODB ───────────────────────────────────────────────────────
mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log("✅ MongoDB connected");
    // Simple migration: ensure canonical names exist for teachers and courses
    try {
      const teachers = await Teacher.find({ canonicalName: { $exists: false } });
      for (const t of teachers) {
        await Teacher.updateOne({ _id: t._id }, { $set: { canonicalName: canon(t.name) } });
      }
      const adminTeachers = await AdminTeacher.find({ canonicalName: { $exists: false } });
      for (const t of adminTeachers) {
        await AdminTeacher.updateOne(
          { _id: t._id },
          { $set: { canonicalName: canon(t.name), canonicalFather: canon(t.fathersName) } }
        );
      }
      const courses = await Course.find({ 
        $or: [
          { canonicalTeacherName: { $exists: false } },
          { canonicalTeacherName: "" }
        ],
        teacherName: { $exists: true, $ne: "" } 
      });
      for (const c of courses) {
        await Course.updateOne({ _id: c._id }, { $set: { canonicalTeacherName: canon(c.teacherName) } });
      }
    } catch (err) {
      console.error("Migration error:", err);
    }
  })
  .catch((err) => console.error("❌ MongoDB error:", err));

// ─── SCHEMAS ──────────────────────────────────────────────────────────────────
const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  class: { type: String },
  canonicalName: { type: String, index: true },
  createdAt: { type: Date, default: Date.now },
});

const teacherSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  canonicalName: { type: String, index: true },
  createdAt: { type: Date, default: Date.now },
});

// ─── NEW SCHEMAS (Admin-added records, no auth required) ──────────────────────
const adminStudentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  fathersName: { type: String, required: true },
  dateOfBirth: { type: String, required: true },
  class: { type: String, required: true },
  canonicalName: { type: String, index: true },
  canonicalFather: { type: String, index: true },
  createdAt: { type: Date, default: Date.now },
});

const adminTeacherSchema = new mongoose.Schema({
  name: { type: String, required: true },
  fathersName: { type: String, required: true },
  dateOfGraduation: { type: String, required: true },
  canonicalName: { type: String, index: true },
  canonicalFather: { type: String, index: true },
  createdAt: { type: Date, default: Date.now },
});

const courseSchema = new mongoose.Schema({
  className: { type: String, required: true }, // e.g., "1", "2", ..., "10"
  subject: { type: String, required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId }, // Can be AdminTeacher ID
  teacherName: { type: String },
  canonicalTeacherName: { type: String, index: true },
  createdAt: { type: Date, default: Date.now },
});

const resultSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  studentName: { type: String, required: true },
  canonicalStudentName: { type: String, index: true },
  className: { type: String, required: true },
  subject: { type: String, required: true },
  mid: { type: Number, default: 0, min: 0, max: 100 },
  final: { type: Number, default: 0, min: 0, max: 100 },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", required: true },
  updatedAt: { type: Date, default: Date.now },
});

const Student = mongoose.model("Student", studentSchema);
const Teacher = mongoose.model("Teacher", teacherSchema);
const AdminStudent = mongoose.model("AdminStudent", adminStudentSchema);
const AdminTeacher = mongoose.model("AdminTeacher", adminTeacherSchema);
const Course = mongoose.model("Course", courseSchema);
const Result = mongoose.model("Result", resultSchema);

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────
const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};

const verifyAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

// ─── STUDENT ROUTES ───────────────────────────────────────────────────────────
app.post("/api/student/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: "All fields required" });

    const exists = await Student.findOne({ email });
    if (exists) return res.status(409).json({ error: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const student = await Student.create({ name, email, password: hashed });
    const token = jwt.sign({ id: student._id, role: "student", email }, JWT_SECRET, {
      expiresIn: "7d",
    });
    res.status(201).json({ message: "Student registered", token, role: "student" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/student/login", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if ((!name && !email) || !password) {
      return res.status(400).json({ error: "Name or email and password required" });
    }
    let student = null;
    if (name) {
      const cName = canon(name);
      student = await Student.findOne({ canonicalName: cName });
      if (!student) {
        const rx = new RegExp(`^${String(name).trim().replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}$`, "i");
        student = await Student.findOne({ name: rx });
      }
    } else {
      student = await Student.findOne({ email });
    }
    if (!student) return res.status(404).json({ error: "Student not found" });
    const match = await bcrypt.compare(password, student.password);
    if (!match) return res.status(401).json({ error: "Invalid password" });
    const token = jwt.sign(
      { id: student._id, role: "student", name: student.name, class: student.class, email: student.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({ message: "Login successful", token, role: "student" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── TEACHER ROUTES ───────────────────────────────────────────────────────────
app.post("/api/teacher/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: "All fields required" });

    const exists = await Teacher.findOne({ email });
    if (exists) return res.status(409).json({ error: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const teacher = await Teacher.create({ name, email, password: hashed });
    const token = jwt.sign({ id: teacher._id, role: "teacher", email }, JWT_SECRET, {
      expiresIn: "7d",
    });
    res.status(201).json({ message: "Teacher registered", token, role: "teacher" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/teacher/login", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if ((!name && !email) || !password) {
      return res.status(400).json({ error: "Name or email and password required" });
    }
    let teacher = null;
    if (name) {
      const cName = canon(name);
      teacher = await Teacher.findOne({ canonicalName: cName });
      if (!teacher) {
        const rx = new RegExp(`^${String(name).trim().replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}$`, "i");
        teacher = await Teacher.findOne({ name: rx });
      }
    } else {
      teacher = await Teacher.findOne({ email });
    }
    if (!teacher) return res.status(404).json({ error: "Teacher not found" });
    const match = await bcrypt.compare(password, teacher.password);
    if (!match) return res.status(401).json({ error: "Invalid password" });
    const token = jwt.sign(
      { id: teacher._id, role: "teacher", name: teacher.name, email: teacher.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({ message: "Login successful", token, role: "teacher" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── ADMIN ROUTES ─────────────────────────────────────────────────────────────
app.post("/api/admin/login", async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: "Password required" });
    if (password !== ADMIN_PASSWORD)
      return res.status(401).json({ error: "Invalid admin password" });

    const token = jwt.sign({ role: "admin", email: "admin@school.com" }, JWT_SECRET, {
      expiresIn: "1d",
    });
    res.json({ message: "Admin login successful", token, role: "admin" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Protected admin dashboard data
app.get("/api/admin/dashboard", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const students = await Student.find({}, "-password");
    const teachers = await Teacher.find({}, "-password");
    res.json({
      totalStudents: students.length,
      totalTeachers: teachers.length,
      students,
      teachers,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── ADMIN: ADD STUDENT (new extended form) ───────────────────────────────────
app.post("/api/admin/students", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { name, fathersName, dateOfBirth, class: studentClass } = req.body;
    if (!name || !fathersName || !dateOfBirth || !studentClass)
      return res.status(400).json({ error: "All fields required" });

    const student = await AdminStudent.create({
      name,
      fathersName,
      dateOfBirth,
      class: studentClass,
      canonicalName: canon(name),
      canonicalFather: canon(fathersName),
    });
    res.status(201).json({ message: "Student added successfully", student });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── ADMIN: GET ALL STUDENTS (extended records) ───────────────────────────────
app.get("/api/admin/students", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const students = await AdminStudent.find().sort({ createdAt: -1 });
    res.json({ students, total: students.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── ADMIN: ADD TEACHER (new extended form) ───────────────────────────────────
app.post("/api/admin/teachers", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { name, fathersName, dateOfGraduation } = req.body;
    if (!name || !fathersName || !dateOfGraduation)
      return res.status(400).json({ error: "All fields required" });

    const teacher = await AdminTeacher.create({
      name,
      fathersName,
      dateOfGraduation,
      canonicalName: canon(name),
      canonicalFather: canon(fathersName),
    });
    res.status(201).json({ message: "Teacher added successfully", teacher });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── ADMIN: GET ALL TEACHERS (extended records) ───────────────────────────────
app.get("/api/admin/teachers", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const teachers = await AdminTeacher.find().sort({ createdAt: -1 });
    res.json({ teachers, total: teachers.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── STUDENT SELF REGISTER (Match With Admin Record) ───────────────────────
app.post("/api/student/self-register", async (req, res) => {
  try {
    const { name, fathersName, class: studentClass, password } = req.body;
    if (!name || !fathersName || !studentClass || !password) {
      return res.status(400).json({ error: "All fields required" });
    }
    const cName = canon(name);
    const cFather = canon(fathersName);
    let adminStudent = await AdminStudent.findOne({
      canonicalName: cName,
      canonicalFather: cFather,
      class: studentClass,
    });
    if (!adminStudent) {
      adminStudent = await AdminStudent.findOne({
        name: String(name).trim(),
        fathersName: String(fathersName).trim(),
      }).collation({ locale: "en", strength: 1 });
    }
    if (!adminStudent) {
      return res.status(404).json({ error: "Student record not found. Contact admin." });
    }
    let existingStudent = await Student.findOne({ canonicalName: cName });
    if (!existingStudent) {
      const rx = new RegExp(`^${String(name).trim().replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}$`, "i");
      existingStudent = await Student.findOne({ name: rx });
    }
    if (existingStudent) {
      return res.status(409).json({ error: "Student already registered" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const student = await Student.create({
      name: String(name).trim(),
      email: `${String(name).trim().replace(/\s+/g, "").toLowerCase()}@school.com`,
      class: adminStudent.class,
      canonicalName: cName,
      password: hashedPassword,
    });
    const token = jwt.sign(
      { id: student._id, role: "student", name: student.name, class: student.class },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.status(201).json({ message: "Student registered successfully", token, role: "student" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── TEACHER SELF REGISTER (Match With Admin Record) ───────────────────────
app.post("/api/teacher/self-register", async (req, res) => {
  try {
    const { name, fathersName, password } = req.body;
    if (!name || !fathersName || !password) {
      return res.status(400).json({ error: "All fields required" });
    }
    const cName = canon(name);
    const cFather = canon(fathersName);
    let adminTeacher = await AdminTeacher.findOne({
      canonicalName: cName,
      canonicalFather: cFather,
    });
    if (!adminTeacher) {
      adminTeacher = await AdminTeacher.findOne({
        name: String(name).trim(),
        fathersName: String(fathersName).trim(),
      }).collation({ locale: "en", strength: 1 });
    }
    if (!adminTeacher) {
      return res.status(404).json({ error: "Teacher record not found. Contact admin." });
    }
    let existingTeacher = await Teacher.findOne({ canonicalName: cName });
    if (!existingTeacher) {
      const rx = new RegExp(`^${String(name).trim().replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}$`, "i");
      existingTeacher = await Teacher.findOne({ name: rx });
    }
    if (existingTeacher) {
      return res.status(409).json({ error: "Teacher already registered" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const teacher = await Teacher.create({
      name: String(name).trim(),
      email: `${String(name).trim().replace(/\s+/g, "").toLowerCase()}@school.com`,
      canonicalName: cName,
      password: hashedPassword,
    });
    const token = jwt.sign(
      { id: teacher._id, role: "teacher", name: teacher.name, email: teacher.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.status(201).json({ message: "Teacher registered successfully", token, role: "teacher" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── ADMIN: COURSE MANAGEMENT ───────────────────────────────────────────────
app.get("/api/admin/courses", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const courses = await Course.find().sort({ className: 1 });
    res.json({ courses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/admin/courses", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { className, subject } = req.body;
    if (!className || !subject) return res.status(400).json({ error: "Class and subject required" });
    const course = await Course.create({ className, subject });
    res.status(201).json({ message: "Course added successfully", course });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/admin/courses/:id/assign", verifyToken, verifyAdmin, async (req, res) => {
  try {
    let { teacherId, teacherName, canonicalTeacherName } = req.body;
    
    // If canonical name is missing (old frontend or old record), generate it
    if (!canonicalTeacherName && teacherName) {
      canonicalTeacherName = canon(teacherName);
    }

    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { teacherId, teacherName, canonicalTeacherName },
      { new: true }
    );
    res.json({ message: "Teacher assigned successfully", course });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/admin/courses/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    await Course.findByIdAndDelete(req.params.id);
    res.json({ message: "Course deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── TEACHER: DASHBOARD DATA ────────────────────────────────────────────────
app.get("/api/teacher/my-courses", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "teacher") return res.status(403).json({ error: "Teacher access required" });
    const teacher = await Teacher.findById(req.user.id);
    if (!teacher) return res.status(404).json({ error: "Teacher account not found" });
    const courses = await Course.find({ canonicalTeacherName: teacher.canonicalName });
    res.json({ courses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/teacher/courses/:className/students", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "teacher") return res.status(403).json({ error: "Teacher access required" });
    const students = await Student.find({ class: req.params.className }, "-password");
    res.json({ students });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── TEACHER: RESULT MANAGEMENT ──────────────────────────────────────────────
app.get("/api/teacher/courses/:className/results/:subject", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "teacher") return res.status(403).json({ error: "Teacher access required" });
    const { className, subject } = req.params;
    const results = await Result.find({ className, subject });
    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/teacher/results", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "teacher") return res.status(403).json({ error: "Teacher access required" });
    const { studentId, className, subject, mid, final } = req.body;
    
    // Verify this teacher is actually assigned to this class/subject
    const teacher = await Teacher.findById(req.user.id);
    const course = await Course.findOne({ 
      className, 
      subject, 
      canonicalTeacherName: teacher.canonicalName 
    });
    
    if (!course) {
      return res.status(403).json({ error: "You are not assigned to this class/subject" });
    }

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ error: "Student not found" });

    const filter = { studentId, className, subject };
    const update = {
      studentName: student.name,
      canonicalStudentName: student.canonicalName,
      mid: Number(mid) || 0,
      final: Number(final) || 0,
      teacherId: teacher._id,
      updatedAt: Date.now()
    };

    const result = await Result.findOneAndUpdate(filter, update, {
      upsert: true,
      new: true
    });

    res.json({ message: "Result updated successfully", result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── STUDENT: DASHBOARD DATA ────────────────────────────────────────────────
app.get("/api/student/my-courses", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "student") return res.status(403).json({ error: "Student access required" });
    const student = await Student.findById(req.user.id);
    if (!student || !student.class) return res.json({ courses: [] });
    const courses = await Course.find({ className: student.class });
    res.json({ courses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/student/my-results", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "student") return res.status(403).json({ error: "Student access required" });
    const results = await Result.find({ studentId: req.user.id });
    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});




// ─── VERIFY TOKEN ROUTE ───────────────────────────────────────────────────────
app.get("/api/verify", verifyToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});

app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
