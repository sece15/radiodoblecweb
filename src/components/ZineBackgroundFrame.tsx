import { ReactNode } from "react";

interface ZineBackgroundFrameProps {
  children: ReactNode;
}

export const ZineBackgroundFrame = ({ children }: ZineBackgroundFrameProps) => {
  return (
    <div style={{ position: "relative", width: "100%", minHeight: "100%", zIndex: 1 }}>
      {/* Zine Background Collage Graphics */}
      <div className="zine-background">
        {/* 1. Crown Top Start */}
        <img
          src="https://lh3.googleusercontent.com/aida/ADBb0ui8TLecdL6JNzmfEpXKMjoK0YxfKXluGR9O5fMjG-UvimDclyjkob1noNJcZ3C_YzuGMG-9NNMo9WT_jIC4o70NgcuaZLWTPVby2mnbICVl1FzIifoOFHZ1k_ocsK890HJJgtO4YB3ljGG4LZcO_-hSRFllysOi2FfOJitfh7lTSFKJu62LWf8isNdR-02Cf0ugbY5RCUZMBdHGCOjJQVUazItrXgaocB6-UINhvEUZwGC89N7L4O12kaRo"
          alt=""
          className="zine-collage-img"
          style={{
            width: "160px",
            top: "50px",
            left: "-30px",
            transform: "rotate(-15deg)",
          }}
        />

        {/* 2. Crown Top End */}
        <img
          src="https://lh3.googleusercontent.com/aida/ADBb0ui8TLecdL6JNzmfEpXKMjoK0YxfKXluGR9O5fMjG-UvimDclyjkob1noNJcZ3C_YzuGMG-9NNMo9WT_jIC4o70NgcuaZLWTPVby2mnbICVl1FzIifoOFHZ1k_ocsK890HJJgtO4YB3ljGG4LZcO_-hSRFllysOi2FfOJitfh7lTSFKJu62LWf8isNdR-02Cf0ugbY5RCUZMBdHGCOjJQVUazItrXgaocB6-UINhvEUZwGC89N7L4O12kaRo"
          alt=""
          className="zine-collage-img"
          style={{
            width: "140px",
            top: "140px",
            right: "-20px",
            transform: "rotate(15deg)",
          }}
        />

        {/* 3. Radio tags (Left Middle) */}
        <img
          src="https://lh3.googleusercontent.com/aida/ADBb0ugGGL-lbQiSmUarSs-qeEK1jFsiLwCxX-mmNEEeX0d_xN9WNBpce1_rG2AJw1cq08G-6JFRb4ylzCzN6xjGsUGhm94ZCQklrC_zowF_nZ09pp3vOOWznW35X_hIAkRtgU_fCQu6ymlooxQ2h7Es90E3redJ-k4EpXskW71d8TNDAEVjiOLNdE2rVXMJASF3PY2vIMAAz4EEBeVjzVjW-o9gh5TOx7qMZKEJa2ENui0bXNbqD5poIXPmAVE"
          alt=""
          className="zine-collage-img"
          style={{
            width: "200px",
            top: "40%",
            left: "-60px",
            transform: "rotate(8deg)",
          }}
        />

        {/* 4. Double C Bombing Logo (Top Center) */}
        <img
          src="https://lh3.googleusercontent.com/aida/ADBb0ug2XjZdeNxy_RtMwvG9fMOMjUjZIUmeXuTR7VXNjeCxq5J10QCpFRZw7HAPYsfd17xM6bHFmmLoYyeBgLzXZkh0FQMPj2mt2tkKdj3UzgIja6eNIDDRL5UkFdc1-aEh8KP8A9tvvSNsGL1b6TSNq3fCYPloOzQOCO9bAqzhbIGzx_0uxfm_H58EU-62AnDT5LNHRx2oLS1S3Tm8AQu4Z3Rn2tvz5vK_E0hLGtBjzbix0kOBieURiJAyKU1n"
          alt=""
          className="zine-collage-img"
          style={{
            width: "280px",
            top: "10px",
            left: "50%",
            marginLeft: "-140px",
            transform: "rotate(-6deg)",
          }}
        />

        {/* 5. X Marks Bottom (Left Corner) */}
        <img
          src="https://lh3.googleusercontent.com/aida/ADBb0uiGNyy4b-9eP3QulEzDyfEISmWPIq7uzxTPaO0FTB2OlHmXztz_gtyEFSBN-kcTJ6_8cQ-YeKj0Tz3YpTnBbT2Cs1gH-IEdmprlj66ofhIfVNeB1uW4j3F45l6A1TwPmBEKo1k7MxxUD8KcmA9c6NgLzKYXCEgqRYNp4YL20cFXepzH_lIPgEJUuRqxUXGjuTGUXtuJsrh8yyDvXHHt1W_ntJQ27KX4oL5QNRH4rRIfAU_BVc16C457-IfT"
          alt=""
          className="zine-collage-img"
          style={{
            width: "180px",
            bottom: "-40px",
            left: "-30px",
            transform: "rotate(10deg)",
          }}
        />

        {/* 6. Splatters (Bottom Right) */}
        <img
          src="https://lh3.googleusercontent.com/aida/ADBb0uhO7HBnstv8N2FumfhVTx_x2fIOLMOotDvvPPyh8OlqvYPW_S-vA0B7eAeL3htQOSjHi-DPLz4RN1Iwt-kbytHPSiBTCGEb-DBe2ysjh3T0rtC3lIBmLCVV2g2J_9BxbU3wR96FNddt480LHwu-siySdLac6ANWUupyiS_5Q2YdwuXeWoqP5elj67n_Jv13f9KvTjD6NLb4CdwJFBIq7lCDgqEvFIOXMgfUx34V1kG7lw1QkbfrpjZFXeM"
          alt=""
          className="zine-collage-img"
          style={{
            width: "160px",
            bottom: "-60px",
            right: "-20px",
            transform: "rotate(45deg)",
          }}
        />
      </div>

      {/* Main Content Area */}
      <div style={{ position: "relative", zIndex: 2, width: "100%", minHeight: "100%" }}>
        {children}
      </div>
    </div>
  );
};
