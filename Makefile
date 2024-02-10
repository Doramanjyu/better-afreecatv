TARGETS := icons LICENSE manifest.* README.md src

FIREFOX_EXCLUDES := manifest.chrome.json
CHROME_EXCLUDES  := manifest.json src/index.html src/notification.worker.js src/permissions.js

VERSION_SUFFIX  :=

FIREFOX_TMPDIR := /tmp/better-afreecatv/firefox
CHROME_TMPDIR  := /tmp/better-afreecatv/chrome

.PHONY: better-afreecatv$(VERSION_SUFFIX)-firefox.zip
better-afreecatv$(VERSION_SUFFIX)-firefox.zip:
	rm -f $@
	rm -rf $(FIREFOX_TMPDIR)
	mkdir -p $(FIREFOX_TMPDIR)
	cp -r $(TARGETS) $(FIREFOX_TMPDIR)/
	cd $(FIREFOX_TMPDIR) \
		&& rm -r $(FIREFOX_EXCLUDES)
	cd $(FIREFOX_TMPDIR) \
		&& zip -r $(CURDIR)/$@ *

.PHONY: better-afreecatv$(VERSION_SUFFIX)-chrome.zip
better-afreecatv$(VERSION_SUFFIX)-chrome.zip:
	rm -f $@
	rm -rf $(CHROME_TMPDIR)
	mkdir -p $(CHROME_TMPDIR)
	cp -r $(TARGETS) $(CHROME_TMPDIR)/
	cd $(CHROME_TMPDIR) \
		&& rm -r $(CHROME_EXCLUDES)
	mv $(CHROME_TMPDIR)/manifest.chrome.json $(CHROME_TMPDIR)/manifest.json
	cd $(CHROME_TMPDIR) \
		&& zip -r $(CURDIR)/$@ *
