// Qt Installer Framework controller for the LunarG Vulkan SDK installer.
// The installer's headless 'install' command is disabled by the vendor, and
// unknown flags fall back to GUI mode (which hangs or no-ops on a headless
// CI runner). A controller script drives the GUI pages programmatically,
// which QtIFW supports on Windows without a display or interaction.
// Used by the workflows' "Install Vulkan SDK (Windows)" step.

function Controller() {
    installer.autoRejectMessageBoxes();
    installer.installationFinished.connect(function () {
        gui.clickButton(buttons.NextButton);
    });
}

Controller.prototype.WelcomePageCallback = function () {
    gui.clickButton(buttons.NextButton);
};

Controller.prototype.CredentialsPageCallback = function () {
    gui.clickButton(buttons.CommitButton);
};

Controller.prototype.IntroductionPageCallback = function () {
    gui.clickButton(buttons.NextButton);
};

Controller.prototype.LicenseAgreementPageCallback = function () {
    var page = gui.currentPageWidget();
    if (page.AcceptLicenseRadioButton !== undefined) {
        page.AcceptLicenseRadioButton.setChecked(true);
    }
    gui.clickButton(buttons.NextButton);
};

Controller.prototype.ComponentSelectionPageCallback = function () {
    // Default component set (the full SDK) is preselected on this page.
    gui.clickButton(buttons.InstallButton);
};

Controller.prototype.TargetDirectoryPageCallback = function () {
    // D: is user-writable on the runner: C:\VulkanSDK would trigger a UAC
    // prompt no headless session can confirm, and the install hangs.
    gui.currentPageWidget().TargetDirectoryLineEdit.setText("D:\\VulkanSDK");
    gui.clickButton(buttons.NextButton);
};

Controller.prototype.ReadyForInstallationPageCallback = function () {
    gui.clickButton(buttons.CommitButton);
};

Controller.prototype.PerformInstallationPageCallback = function () {};

Controller.prototype.InstallationFinishedPageCallback = function () {
    gui.clickButton(buttons.FinishButton);
};
