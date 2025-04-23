# 🕸️ Auto Skip YouTube Ads

A powerful UserScript that automatically skips YouTube ads instantly while maintaining a low detection profile. This tool enhances your YouTube experience by removing intrusive advertisements seamlessly.

![YouTube Ads Skipper](./assets/icons/youtube-ads-skipper.png)

## Features

- 🚀 Instant ad skipping for video ads, pie countdowns, and survey prompts
- 🛡️ Smart banner ads and sponsored content removal
- 🔄 Efficient ad detection using MutationObserver
- 🎯 Anti-detection system with randomized actions
- ⚙️ Customizable configuration options
- 🔔 Automatic update notifications

## Prerequisites

- A modern web browser (Firefox, Chrome, Opera, Safari, or Edge)
- A UserScript manager extension (Tampermonkey or Greasemonkey)

## Installation

1. Install a UserScript manager:
   - [Tampermonkey](https://www.tampermonkey.net/) (Recommended)
   - [Greasemonkey](https://greasyfork.org/en/scripts/533766-auto-skip-youtube-ads-gurveer)
2. [Click here to install the script](https://greasyfork.org/en/scripts/533766-auto-skip-youtube-ads-gurveer)
3. Confirm the installation in your UserScript manager

## Configuration

Customize the script behavior by editing the `config` object:

```javascript
config = {
  debug: false,              // Enable for detailed logging
  updateCheckInterval: 24,    // Hours between update checks
  maxRetries: 3,             // Number of skip attempts
  aggressiveAdRemoval: true   // Enhanced ad blocking
}
```

## Compatibility

### Supported Browsers

- Firefox (Recommended)
- Google Chrome
- Microsoft Edge
- Opera
- Safari

### Supported Platforms

- www.youtube.com
- m.youtube.com
- music.youtube.com

## Troubleshooting

- **Ads not skipping?** Ensure the script is enabled and try refreshing the page
- **Script conflicts?** Disable other ad-blockers temporarily
- **Updates not working?** Check your UserScript manager's settings

## Contributing

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## Changelog

### v1.0.0

- Initial release
- Basic ad-skipping functionality
- Configuration options

## License

MIT License - feel free to modify and share!

## Author

Gurveer (https://github.com/gurr-i/browser-scripts)

## Support

If you find this useful, please star the repository! For issues or suggestions, create an issue on GitHub.
