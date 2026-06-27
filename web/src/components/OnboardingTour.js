"use client";

import { useState, useEffect } from "react";
import Joyride, { STATUS } from "react-joyride";
import { useAuth } from "../lib/auth";

export default function OnboardingTour() {
  const { user } = useAuth();
  const [run, setRun] = useState(false);

  useEffect(() => {
    // Only run if user is logged in and hasn't completed the tour
    if (user && !localStorage.getItem("tourCompleted")) {
      // Delay slightly to ensure UI is rendered
      const timer = setTimeout(() => setRun(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleJoyrideCallback = (data) => {
    const { status } = data;
    const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];
    
    if (finishedStatuses.includes(status)) {
      setRun(false);
      localStorage.setItem("tourCompleted", "true");
    }
  };

  const steps = [
    {
      target: "body",
      content: "Welcome to SkillPay! Let's take a quick tour to get you started.",
      placement: "center",
      disableBeacon: true,
    },
    {
      target: ".lucide-bell", // from NavBar
      content: "Here is your Notification Center. We'll alert you about challenges and payouts here.",
    },
    {
      target: "a[href='/challenges']",
      content: "Browse open challenges and start earning XLM by submitting your proof of work.",
    },
    {
      target: "a[href='/dashboard']",
      content: "Track your earnings growth and view your submissions in your personal dashboard.",
    }
  ];

  return (
    <Joyride
      callback={handleJoyrideCallback}
      continuous
      hideCloseButton
      run={run}
      scrollToFirstStep
      showProgress
      showSkipButton
      steps={steps}
      styles={{
        options: {
          arrowColor: "#111",
          backgroundColor: "#111",
          primaryColor: "#facc15",
          textColor: "#eaeaea",
          overlayColor: "rgba(0, 0, 0, 0.7)",
        },
        tooltipContainer: {
          textAlign: "left",
          border: "1px solid #2a2a2a",
          borderRadius: "4px"
        },
        buttonNext: {
          backgroundColor: "#facc15",
          color: "#111",
          fontWeight: 500,
        },
        buttonBack: {
          color: "#eaeaea",
        },
        buttonSkip: {
          color: "#888888",
        }
      }}
    />
  );
}
