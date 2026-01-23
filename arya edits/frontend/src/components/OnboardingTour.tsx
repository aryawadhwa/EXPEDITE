import { useEffect } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export function OnboardingTour() {
  useEffect(() => {
    // Check if user has already seen the tour
    const hasSeenTour = localStorage.getItem("expedite-ai-tour-seen");

    if (!hasSeenTour) {
      const tour = driver({
        showProgress: true,
        steps: [
          {
            element: "#sidebar-launchpad",
            popover: {
              title: "Launchpad",
              description: "Start here! define your mission objective and launch searching agents."
            }
          },
          {
            element: "#sidebar-active-agents",
            popover: {
              title: "Active Agents",
              description: "Watch your agents working in real-time as they scout and research."
            }
          },
          {
            element: "#sidebar-review-queue",
            popover: {
              title: "Review Queue",
              description: "The most important part! Review and approve the emails drafted by AI before they are sent."
            }
          },
          {
            element: "#sidebar-mission-chat",
            popover: {
              title: "Mission Chat",
              description: "Chat with your agents to give feedback or adjust the mission on the fly."
            }
          }
        ],
        onDestroyStarted: () => {
          localStorage.setItem("expedite-ai-tour-seen", "true");
          tour.destroy();
        },
      });

      tour.drive();
    }
  }, []);

  return null; // This component doesn't render anything visible itself
}
