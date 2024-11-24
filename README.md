## Disclaimer! Use this app at your own risk! 

# This app uses dapps outside of how they were normally designed. There may be unexpected behavior or interactions with apps that are outside of my control. I strongly recommend clicking the external link button to connect to the dapp directly when making large transactions.


# Usage
This is an experimental web app designed to trade with multiple dexes in one place. Intensive trading often requires multiple windows or monitors to have an effective edge, ShellOS is designed to organize this all in one place in an optimized manner.

# Setup

npm install @ source directory
npm run dev to run it locally

# known issues/notes

-some dapps don't like this style of embedding, icpswap and kong require a proxy server to access. coming soon TM until a sandbox is made.

-Uniswap and jupiter may have issues on mobile, desktop has worked better in my tests. If this occurs, I can recommend cross-chain on pancakeswap as I have had the least issues.

-For mobile use, I recommend a max of 2-3 tabs. Optimizing this further slows down the experience for more powerful devices.

# Fixes

- Fixed issues with tabs and window management. Switching between tabs and all that now works as intended. The main window X button will only close the tab you're in, unless users want this changed I will keep this as is.

# For devs

ShellOS is lightwieght (main component is 780 lines including spacing) and was made in nextjs 15 + react 19. You can add this entire app to your app by adding <MagicLaucher /> to your page.tsx or other main component file. The design of having this entire app in a single component is highly questionable, however I found that it makes is actually quite nice to work with in other projects since you can put it into a tab, seperate page, and only need to edit a few lines of code to add or remove websites.

# How to add or remove apps

1. Ctrl + F and search for "add more sites here"
2. Scroll to the bottom of the const variable until you see the final app (id 10 at the time of writing this)
3. Copy and paste the following code after the final entry ``` {
      id: [ENTER ID NUMBER],
      title: "[ENTER APP NAME]",
      description: "[ENTER APP DESCRIPTION]",
      url: "[PASTE DAPP URL]"
    },
   ```
5. Change the id to be +1 of the final ID (ig. if the final id is 10, change this entry to 11)
6. Add your name, description, and URL.
7. That's it! You should see the website added automatically once you save the file.

Note: If you add a dapp and see a 404 or "can't access this page". This is a policy on the website blocking connection to prevent bots. This requires a proxy server to bypass or another integration method to specially bypass this. This has not been added as of yet and is being considered for future iterations.
