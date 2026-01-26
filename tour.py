import time
import sys

def type_text(text, delay=0.03):
    for char in text:
        sys.stdout.write(char)
        sys.stdout.flush()
        time.sleep(delay)
    print()

def start_tour():
    print("\n" + "="*60)
    print("🚀 OUTBOUND AI MISSION BRIEFING 🚀")
    print("="*60 + "\n")
    
    time.sleep(1)
    
    type_text("👨‍🚀 MISSION COMMANDER: 'Welcome aboard, Agent. Ready to scale your outreach to the stars?'")
    time.sleep(0.5)
    
    print("\n--- 🛰️ 1. THE LAUNCHPAD ---")
    type_text("This is your Ground Zero. You don't just 'start a task' here—you launch a MISSION.")
    type_text("Input your objective (e.g., 'Find me 50 AI Founders in SF') and hit Launch.")
    type_text("Our swarm of autonomous agents will start scanning the digital universe immediately.")
    
    time.sleep(1)
    
    print("\n--- 📝 2. THE REVIEW QUEUE ---")
    type_text("AI is powerful, but YOU are the Captain. Before any message hits an inbox, it lands here.")
    type_text("Think of this as the 'Diplomatic Clearance' center.")
    type_text("Check the drafts, refine the tone, and give the 🟢 APPROVE or 🔴 REJECT signal.")
    type_text("The agent learns from your feedback, becoming more like you with every click.")
    
    time.sleep(1)
    
    print("\n--- 💬 3. THE MISSION CHAT (Right Sidebar) ---")
    type_text("Need a status report? Just ask. The chatbox on the right is your direct uplink to the AI's brain.")
    type_text("You can ask things like: 'Who have you found so far?' or 'Pivot the search to New York.'")
    type_text("It's real-time, it's alive, and it's where the strategy happens.")
    
    time.sleep(1)
    
    print("\n" + "="*60)
    type_text("✨ SYSTEMS NOMINAL. YOU ARE READY TO CONQUER THE OUTBOUND SECTOR. ✨")
    print("="*60 + "\n")

if __name__ == "__main__":
    start_tour()
