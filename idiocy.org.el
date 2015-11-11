(setq org-publish-project-alist
      '(("idiocy.org"
         :components ("blog-content" "blog-static"))
        ("blog-content"
         :base-directory "~/Documents/idiocy.org"
         :base-extension "org"
         ;;:publishing-directory "/ssh:alan@idiocy.org:/www/idiocy.org/htdocs/"
         :publishing-directory "/tmp/blog"
         :recursive t
         :publishing-function (org-html-publish-to-html)
         :with-tags nil
         :headline-levels 4             ; Just the default for this project.
         :with-toc nil
         :section-numbers nil
         :with-sub-superscript nil
         :with-todo-keywords nil
         :with-author nil
         :with-creator nil
         :html-preamble "idiocy.org"
         :html-postamble nil
         ;;:style "This is raw html for stylesheet <link>'s"
         :with-timestamp t
         :exclude-tags ("noexport" "todo"))
        ("blog-static"
         :base-directory "~/Documents/idiocy.org"
         :base-extension "css\\|js\\|png\\|jpg\\|gif\\|svg\\|pdf\\|mp3\\|ogg"
         ;;:publishing-directory "/ssh:alan@idiocy.org:/www/idiocy.org/htdocs/"
         :publishing-directory "/tmp/blog"
         :recursive t
         :publishing-function org-publish-attachment)))
