# How to Run This Project on Your Local Machine

This guide provides step-by-step instructions to get the Sahayak.AI application running on your computer.

### Step 1: Download the Project Files

You will need to download the entire project folder to your computer.

### Step 2: Install Prerequisites

*   **Node.js:** This project requires Node.js. If you don't have it installed, please download and install the **LTS (Long-Term Support)** version from the official [Node.js website](https://nodejs.org/). Installing Node.js will also automatically install `npm`, which is the package manager we need.
*   **Code Editor:** A code editor like [Visual Studio Code](https://code.visualstudio.com/) is highly recommended.

### Step 3: Get Your Gemini API Key

The AI features in this app are powered by Google's Gemini models. To use them, you will need a free API key.

1.  Visit the **[Google AI Studio](https://aistudio.google.com/app/apikey)**.
2.  Click the **"Create API key in new project"** button.
3.  A new API key will be generated for you. **Copy this key** to your clipboard.

### Step 4: Configure and Run the App

1.  **Open the Project in Your Editor:** Open the downloaded project folder in your code editor.

2.  **Open the Terminal:** Use the integrated terminal in your code editor. This is typically found under a "Terminal" menu at the top of the screen.

3.  **Create the Environment File:** In the root directory of your project (the main folder), create a new file and name it exactly **`.env.local`**.

4.  **Add Your API Key:** Inside the `.env.local` file, add the following line. Replace `YOUR_API_KEY_HERE` with the actual API key you copied from the Google AI Studio.

    ```
    GEMINI_API_KEY=YOUR_API_KEY_HERE
    ```

5.  **Install Dependencies:** In the terminal, run the following command. This will read the `package.json` file and install all the required libraries for the project.
    ```bash
    npm install
    ```

6.  **Run the Development Server:** Once the installation is complete, start the application by running:
    ```bash
    npm run dev
    ```

7.  **View the Application:** You will see a message in the terminal indicating that the server has started, usually on port 3000. Open your web browser and navigate to:
    > **http://localhost:3000**

You should now see the Sahayak.AI application running locally! To stop the server, go back to your terminal and press `Ctrl + C`.
