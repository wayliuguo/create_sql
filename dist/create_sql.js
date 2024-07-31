#!/usr/bin/env node
"use strict";const e=require("../libs/parse_config"),r=require("../libs/parse_code"),s=require("../libs/generate_sql"),i=r.parseCode(e);s.generateSql(e,i);
