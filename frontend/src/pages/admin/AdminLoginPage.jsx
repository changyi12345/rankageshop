import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import SecurityIcon from "@mui/icons-material/Security";
import Avatar from "@mui/material/Avatar";
import Container from "@mui/material/Container";
import { isAdminRole } from "../../utils/roles";

const theme = createTheme({
  palette: {
    primary: { main: "#1E40AF", light: "#3B82F6", dark: "#1E3A8A" },
    secondary: { main: "#2563EB", light: "#60A5FA", dark: "#1D4ED8" },
  },
});

export default function AdminLoginPage() {
  const { login, verifyAdmin2FA, logout, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [twoFactorToken, setTwoFactorToken] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [step, setStep] = useState("login");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user && isAdminRole(user.role)) {
      navigate("/admin", { replace: true });
    }
  }, [authLoading, user, navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login(username, password);
      if (data?.requires2FA) {
        setTwoFactorToken(data.twoFactorToken);
        setStep("2fa");
        setTwoFactorCode("");
        return;
      }
      const loggedInUser = data?.user;
      if (!isAdminRole(loggedInUser?.role)) {
        logout({ skipConfirm: true });
        setError("This account does not have admin access. Use the store sign-in page instead.");
        return;
      }
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(err.message || "Admin login failed.");
    } finally {
      setLoading(false);
    }
  };

  const onVerify2FA = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await verifyAdmin2FA(twoFactorToken, twoFactorCode.trim());
      if (!isAdminRole(data?.user?.role)) {
        logout({ skipConfirm: true });
        setError("This account does not have admin access.");
        return;
      }
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(err.message || "Invalid verification code.");
    } finally {
      setLoading(false);
    }
  };

  const backToLogin = () => {
    setStep("login");
    setTwoFactorToken("");
    setTwoFactorCode("");
    setError("");
  };

  if (authLoading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-blue-50">
          <CircularProgress color="primary" />
        </div>
      </ThemeProvider>
    );
  }

  if (user && isAdminRole(user.role)) {
    return null;
  }

  const is2faStep = step === "2fa";

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-blue-50 to-blue-100 py-12 px-4">
        <Container component="main" maxWidth="xs">
          <Paper
            elevation={6}
            sx={{
              padding: 4,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              borderRadius: 4,
              background: "rgba(255, 255, 255, 0.95)",
            }}
          >
            <Avatar sx={{ m: 1, bgcolor: "primary.main", width: 56, height: 56 }}>
              {is2faStep ? <SecurityIcon sx={{ fontSize: 32 }} /> : <LockOutlinedIcon sx={{ fontSize: 32 }} />}
            </Avatar>
            <Typography component="h1" variant="h5" sx={{ fontWeight: "bold", color: "#1E40AF" }}>
              {is2faStep ? "Two-Factor Authentication" : "Admin Sign In"}
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mt: 1, textAlign: "center" }}>
              {is2faStep
                ? "Enter the 6-digit code from your authenticator app or a backup code."
                : "Access the RanKageShop admin dashboard"}
            </Typography>

            {is2faStep ? (
              <Box component="form" onSubmit={onVerify2FA} sx={{ mt: 3, width: "100%" }}>
                {error && (
                  <Typography
                    color="error"
                    variant="body2"
                    sx={{ mb: 2, textAlign: "center", p: 1, bgcolor: "#dbeafe", borderRadius: 1 }}
                  >
                    {error}
                  </Typography>
                )}
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="twoFactorCode"
                  label="Verification code"
                  name="twoFactorCode"
                  autoComplete="one-time-code"
                  autoFocus
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={loading || !twoFactorCode.trim()}
                  sx={{
                    mt: 3,
                    mb: 1,
                    py: 1.5,
                    borderRadius: 2,
                    fontWeight: "bold",
                    background: "linear-gradient(135deg, #1E40AF 0%, #2563EB 100%)",
                  }}
                >
                  {loading ? <CircularProgress size={24} sx={{ color: "white" }} /> : "Verify & continue"}
                </Button>
                <Button fullWidth variant="text" onClick={backToLogin} sx={{ mt: 1 }}>
                  ← Back to login
                </Button>
              </Box>
            ) : (
              <Box component="form" onSubmit={onSubmit} sx={{ mt: 3, width: "100%" }}>
                {error && (
                  <Typography
                    color="error"
                    variant="body2"
                    sx={{ mb: 2, textAlign: "center", p: 1, bgcolor: "#dbeafe", borderRadius: 1 }}
                  >
                    {error}
                  </Typography>
                )}
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="username"
                  label="Email or Username"
                  name="username"
                  autoComplete="username"
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type="password"
                  id="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={loading}
                  sx={{
                    mt: 3,
                    mb: 2,
                    py: 1.5,
                    borderRadius: 2,
                    fontWeight: "bold",
                    background: "linear-gradient(135deg, #1E40AF 0%, #2563EB 100%)",
                  }}
                >
                  {loading ? <CircularProgress size={24} sx={{ color: "white" }} /> : "Sign In"}
                </Button>
                <Box sx={{ textAlign: "center", mt: 2 }}>
                  <Link to="/" style={{ color: "#1E40AF", textDecoration: "none", fontWeight: "medium" }}>
                    ← Back to Store
                  </Link>
                </Box>
              </Box>
            )}
          </Paper>
        </Container>
      </div>
    </ThemeProvider>
  );
}
