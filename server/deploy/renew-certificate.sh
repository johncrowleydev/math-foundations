#!/bin/sh
case " ${RENEWED_DOMAINS:-} " in
  *" foundations.johncrowley.dev "*) nginx -t && systemctl reload nginx ;;
esac
