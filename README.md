## Upwork Total Earnings

This chrome extension will enable display of the full Total earnings amount, regardless of the increment step.

> [!NOTE]
> Upwork updates earnings in increments of $100 after $100, $1,000 after $1,000, and $10,000 after $10,000. For example, if you earn $200, your earnings will appear as $200 until you reach $300, when they will appear as $300. After that, your earnings will appear in increments of $100,000, and so on.
>
> With this extension, if you earn $19.500.25, your earnings will appear as $19.500 instead of $10K+ as Upwork will display it.

**Notes:**
1. This extension is strictly for accesibility purposes and only shows the full Total earnings amount for those that have the extension installed.
2. To see the Total earnings amount, viewed profiles must have the Total earnings displayed on their profiles.
3. To see somebody else's Total earnings you have to be logged in on Upwork, otherwise the Total earnings section will be hidden by Upwork.

## Compiling the extension

In the project directory, you can run:

`npm install`

> [!IMPORTANT]
> Installs webpack and libraries necessary for compiling the extension.

After installing the libraries, you can run:

`npx webpack --config webpack.config.js`

> [!IMPORTANT]
> Compiles the source code which will output the `content.js` file which is used to run the extension (see `manifest.json`).

## Testing the extension

Go to Chrome > Manage Extensions and:
1. Toggle `Developer mode` ON.
2. Click `Load unpacked`.
3. Select the `chromex-upwork-earnings` folder.

The extension is now installed and you can test it on any Upwork profile (you must be logged in to see the Total earnings).