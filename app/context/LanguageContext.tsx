'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'th' | 'en';

const translations = {
  th: {
    // Navbar
    nav_title: 'Trading Journal',
    nav_record: 'บันทึกเทรด',
    nav_dashboard: 'แดชบอร์ด',
    lang_btn: '🇺🇸 EN',

    // Home Page
    page_title: 'บันทึกการเทรด',
    page_subtitle: 'บันทึกการเทรดของคุณอย่างเป็นระบบ',
    section_details: 'ข้อมูลการเทรด',
    section_psycho: 'จิตวิทยาและวินัย',
    
    // Form Labels
    label_symbol: 'สินทรัพย์',
    label_open_date: 'วันที่เปิด',
    label_open_time: 'เวลาเปิด',
    label_close_date: 'วันที่ปิด',
    label_close_time: 'เวลาปิด',
    label_direction: 'ทิศทาง',
    label_position: 'ขนาด (Troy Oz)',
    label_entry: 'ราคาเข้า',
    label_exit: 'ราคาออก',
    label_sl: 'จุดตัดขาดทุน (SL)',
    label_tp: 'จุดทำกำไร (TP)',
    label_strategy: 'กลยุทธ์',
    label_emotion: 'ระดับอารมณ์ (1-10)',
    label_mistake: 'ข้อผิดพลาดหลัก',
    label_plan: 'ทำตามแผนไหม',
    label_notes: 'บันทึกเพิ่มเติม',
    
    // Placeholders & Options
    ph_position: 'เช่น 100 (1 Lot), 10 (0.1 Lot)',
    ph_emotion: '1 = เฉยๆ | 10 = กลัว/โลภมาก',
    ph_notes: 'เหตุผลเข้า? อารมณ์ตลาด?',
    opt_optional: '(ไม่ระบุได้)',
    opt_no_mistake: 'ไม่มีข้อผิดพลาด',
    
    // Dropdown Values
    val_buy: 'Buy (ซื้อ)',
    val_sell: 'Sell (ขาย)',
    val_yes: 'ใช่ (Yes)',
    val_no: 'ไม่ (No)',

    // Messages
    msg_auto_calc: 'ระบบคำนวณ P&L, R:R และเวลาที่ถือให้อัตโนมัติ',
    btn_save: 'บันทึกเทรด',
    btn_saving: 'กำลังบันทึก...',
    msg_success: '✅ บันทึกสำเร็จ!',
    msg_error: '❌ เกิดข้อผิดพลาด: ',
    msg_fail: '❌ บันทึกไม่สำเร็จ',
    msg_loading: 'กำลังโหลดข้อมูล...',

    // --- Dashboard ---
    dash_title: 'แดชบอร์ดสรุปผล',
    dash_subtitle: 'วิเคราะห์สถิติและพฤติกรรมการเทรดของคุณ',
    btn_refresh: '↻ รีเฟรช',
    btn_refreshing: 'กำลังโหลด...',
    
    // Sections
    dash_table_title: '📝 ประวัติการเทรด',
    dash_chart_title: '⏰ ช่วงเวลาทำกำไร',
    dash_chart_legend: 'เส้นฟ้า = ราคาเข้า · เส้นส้ม = กำไร/ขาดทุน',
    dash_perf_title: '📈 สรุปผลงาน',
    dash_risk_title: '🛡️ การคุมความเสี่ยง',
    dash_psycho_title: '🧠 จิตวิทยา',
    dash_strat_title: '🎯 แยกตามกลยุทธ์',

    // Stats Labels & Units
    stat_total_trades: 'จำนวนเทรด',
    stat_win_rate: 'อัตราชนะ',
    stat_total_pnl: 'กำไรสุทธิ',
    stat_profit_factor: 'สัดส่วนกำไรต่อขาดทุน',
    stat_avg_rr: 'R:R เฉลี่ย',
    stat_max_dd: 'ขาดทุนสะสมสูงสุด',
    stat_plan_adherence: 'วินัยตามแผน',
    stat_common_mistake: 'จุดพลาดบ่อย',
    stat_emotion_impact: 'ผลกระทบอารมณ์',
    stat_best_strategy: 'ท่าไม้ตาย',
    stat_avg_win: 'กำไรเฉลี่ย',
    stat_avg_loss: 'ขาดทุนเฉลี่ย',
    
    // Chart Labels
    chart_avg_entry: 'ราคาเข้าเฉลี่ย',
    chart_avg_pnl: 'กำไรเฉลี่ย',

    // Units
    unit_w: 'ชนะ',
    unit_l: 'แพ้',
    unit_be: 'เสมอ',
    unit_times: 'ครั้ง',
    unit_trades: 'ไม้',

    // Stats Notes
    stat_target_winrate: 'เป้าหมาย: ≥50%',
    stat_target_pf: 'เป้าหมาย: ≥1.5 (ดี)',
    stat_target_rr: 'เป้าหมาย: ≥2:1 (ดี)',
    stat_target_dd: 'ควรต่ำกว่า 15-20%',
    stat_plan_note: 'เทรดตรงตามแผน',
    stat_no_mistake: 'เทรดดี ไม่มีหลุดวินัย 🎉',
    stat_emotion_note: 'เสียเงินเมื่ออารมณ์ ≥7',
    stat_best_strat_note: 'ต้องมีข้อมูลมากกว่านี้',

    // Strategy Table Headers
    th_strategy_name: 'กลยุทธ์',
    th_trades_count: 'จำนวนไม้',
    th_winrate: 'อัตราชนะ',
    th_total_pnl: 'กำไรสุทธิ',
    th_avg_pnl: 'กำไรเฉลี่ย',

    // TradesTable Headers (ปรับให้สั้นลงเพื่อความสวยงาม)
    th_no: 'จำนวน',
    th_symbol: 'สินทรัพย์',
    th_open_date: 'วันเปิด',
    th_close_date: 'วันปิด',
    th_open_time: 'เวลาเปิด',
    th_close_time: 'เวลาปิด',
    th_dir: 'ทิศทาง',
    th_pos: 'ขนาด (Oz)',
    th_entry: 'ราคาเข้า',
    th_exit: 'ราคาออก',
    th_sl: 'SL',
    th_tp: 'TP',
    th_pnl: 'กำไร/ขาดทุน',
    th_pnl_pct: '% การเติบโต',
    th_rr: 'R:R',
    th_time: 'เวลาที่ถือ',
    th_strategy: 'กลยุทธ์',
    th_emo: 'อารมณ์',
    th_mistake: 'พลาดเรื่อง',
    th_plan: 'ตามแผน',
    th_notes: 'โน้ต',
    th_del: 'ลบ',

    // TradesTable UI
    tt_edit_hint: 'คลิกที่ช่องเพื่อแก้ไข • กด Enter เพื่อบันทึก • กด Esc เพื่อยกเลิก',
    tt_no_data: 'ยังไม่มีข้อมูลเทรด เริ่มบันทึกไม้แรกเลย!',
    tt_btn_start: 'เริ่มบันทึก',
    tt_prev: 'ก่อนหน้า',
    tt_next: 'ถัดไป',
    tt_page_info: 'รายการ • หน้า',
    tt_save_success: '✅ บันทึกเรียบร้อย',
    tt_del_success: '✅ ลบเรียบร้อย',
    tt_save_error: '❌ บันทึกไม่ได้',
    tt_del_error: '❌ ลบไม่ได้',
    tt_confirm_del: 'แน่ใจนะว่าจะลบรายการนี้?',

    // --- Trading Insights (การวิเคราะห์เชิงลึก) ---
    insight_title: 'เจาะลึกพฤติกรรมการเทรด',
    insight_sys_exp: 'ความคาดหวังระบบ (Expectancy)',
    insight_per_trade: '/ ไม้',
    
    // 🔴 Red Flags (สัญญาณอันตราย)
    insight_red_title: 'จุดที่ต้องระวัง (Red Flags)',
    
    insight_streak_title: 'พักก่อน! (Stop Trading)',
    insight_streak_suffix: 'ไม้ติดแล้ว',
    insight_streak_desc: 'คุณกำลังขาดสติ (Tilt)! ใช้กฎ Walk Away ลุกจากหน้าจอ 30 นาทีเพื่อลดความเครียดด่วน',
    
    insight_fattail_title: 'ระวังล้างพอร์ต (Fat Tail Risk)',
    insight_fattail_desc_1: 'มีการขาดทุนไม้เดียวหนักถึง',
    insight_fattail_desc_2: '(ใหญ่กว่าปกติ',
    insight_fattail_desc_3: 'เท่า) ต้องตั้ง SL ให้เคร่งครัด ไม่งั้นล้างพอร์ตแน่นอน',

    insight_dispo_title: 'ทนฟ้าไม่ไหว ทนแดงนาน (Disposition Effect)',
    insight_dispo_desc_1: 'คุณถือไม้ขาดทุนนานกว่าไม้กำไรถึง',
    insight_dispo_desc_2: 'เท่า นี่คืออาการกลัวเสียเงิน (Loss Aversion) ต้องกล้า Cut Loss ให้เร็วขึ้น',

    insight_emo_title: 'อารมณ์พาพัง (Emotional Ruin)',
    insight_emo_desc_1: 'เมื่ออารมณ์รุนแรง (ระดับ ≥ 7) คุณชนะแค่',
    insight_emo_desc_2: 'แนะนำให้ฝึกสมาธิก่อนเริ่มเทรด',

    insight_disc_title: 'ราคาของการไร้วินัย',
    insight_disc_desc_1: 'การไม่ทำตามแผนทำให้คุณเสียโอกาสกำไรเฉลี่ย',
    insight_disc_desc_2: 'ต่อไม้',

    insight_dd_title: 'Drawdown สูงน่าห่วง',
    insight_dd_desc: 'เข้าข่ายอันตราย! ควรลดขนาด Lot ลง 50% ตามหลัก Kelly Criterion จนกว่าจะกู้พอร์ตคืนได้',
    
    insight_safe: 'ยังไม่พบสัญญาณอันตรายร้ายแรง รักษาวินัยต่อไปครับ 👍',

    // New Red Flags
    insight_revenge_title: 'ระวังการเอาคืน (Revenge Trading)',
    insight_revenge_desc: 'คุณเพิ่ม Lot หลังขาดทุน! นี่คือสัญญาณของการใช้อารมณ์ อยากได้คืนเร็วๆ ระวังพอร์ตพัง',
    
    insight_bias_title: 'ยึดติดฝั่งเดียว (Directional Bias)',
    insight_bias_desc: 'คุณเทรดฝั่ง {dir} แย่มาก (ชนะแค่ {rate}%) ในขณะที่อีกฝั่งทำได้ดี ลองพักฝั่งนี้ก่อน',
    
    insight_rr_mismatch_title: 'ได้ไม่คุ้มเสีย (Risk:Reward แย่)',
    insight_rr_mismatch_desc: 'คุณเสียทีละ $${loss} แต่ได้คืนแค่ $${win} เท่ากับว่าเสียครั้งเดียว คืนกำไรที่หามาได้เกือบหมด! ต้องกล้า Cut Loss ให้เร็วกว่านี้ครับ',
    
    insight_no_sl_title: 'อันตราย! ไม่ตั้ง SL',
    insight_no_sl_desc: 'พบออเดอร์ที่ "ไม่ตั้ง SL" หรือลากจนขาดทุนหนัก นิสัยนี้จะทำให้ล้างพอร์ตได้ในไม้เดียว',
    
    insight_strategy_hop_title: 'เปลี่ยนระบบบ่อยไป (System Hopping)',
    insight_strategy_hop_desc: 'ช่วง 10 ไม้ล่าสุด คุณเปลี่ยนกลยุทธ์ไปมาตลอด เลือกสักทางแล้วฝึกให้เชี่ยวชาญดีกว่าครับ',
    
    insight_tilt_title: 'ระวังหัวร้อน (Tilt Detected)',
    insight_tilt_desc: 'มีการกดเทรดถี่ๆ และขาดทุนติดกันในเวลาสั้นๆ หยุดพักหายใจด่วน!',
    
    insight_monday_title: 'อาถรรพ์วันจันทร์ (Monday Blues)',
    insight_monday_desc: 'สถิติชี้ว่าวันจันทร์คุณมักจะขาดทุน ตลาดเปิดอาจยังไม่ชัดเจน ลองเริ่มเทรดวันอังคารไหม?',

    insight_morning_loss_title: 'วอร์มเครื่องก่อน (Warm-up Needed)',
    insight_morning_loss_desc: 'ไม้แรกของวันมักจะขาดทุนเสมอ ลองลด Size ไม้แรก หรือแค่นั่งดูกราฟก่อนเข้าเทรดจริง',

    insight_overconfidence_title: 'กับดักความมั่นใจ (Overconfidence)',
    insight_overconfidence_desc: 'หลังจากชนะไม้ใหญ่ คุณมักจะคืนกำไรทันทีในไม้ถัดไป ระวังความประมาท',

    insight_breakeven_abuse_title: 'รีบกันทุนไปไหม (BE Abuse)',
    insight_breakeven_abuse_desc: 'มีไม้เสมอ (BE) เยอะมาก คุณอาจจะรีบเลื่อน SL กันทุนเร็วไปเพราะกลัวกำไรหาย ปล่อยให้กราฟวิ่งบ้าง',

    // 🚀 Optimization (Green Flags)
    insight_opt_title: 'โอกาสทำกำไร (Optimization)',
    
    insight_exp_title: 'ค่าความคาดหวัง (Expectancy)',
    insight_exp_desc: 'ทุกครั้งที่กดเทรด ค่าเฉลี่ยคือคุณจะได้เงิน',
    insight_exp_pos: '(ระบบเป็นบวก ทำซ้ำไปเรื่อยๆ พอร์ตโตแน่นอน)',
    insight_exp_neg: '(ระบบติดลบ ต้องแก้ Win Rate หรือ R:R ด่วน)',

    insight_hour_title: 'ช่วงเวลาทอง (Golden Hour)',
    insight_hour_desc: 'เวลาทำเงินของคุณคือ',
    insight_hour_desc_end: 'โฟกัสเทรดแค่ช่วงนี้ก็พอ',

    insight_day_title: 'วันโกยเงิน (Lucky Day)',
    insight_day_desc: 'วัน',
    insight_day_desc_end: 'เป็นวันที่คุณทำกำไรได้มากที่สุด',

    insight_hot_title: 'ระวังกับดักความมั่นใจ (Hot Hand)',
    insight_hot_desc_1: 'ชนะมา',
    insight_hot_desc_2: 'ไม้ติด อย่าเพิ่งเพิ่มไซส์! สถิติบอกว่าคนส่วนใหญ่มักจะคืนกำไรช่วงนี้เพราะประมาท',

    insight_over_title: 'เทรดถี่ไปไหม? (Overtrading)',
    insight_over_desc_1: 'เฉลี่ย',
    insight_over_desc_2: 'ไม้/วัน แต่ผลลัพธ์ยังไม่ดี เน้นคุณภาพมากกว่าปริมาณดีกว่าครับ',

    insight_good_title: 'มาถูกทางแล้ว!',
    insight_good_desc_1: 'Profit Factor',
    insight_good_desc_2: '(> 1.5) แสดงว่าคุณทำกำไรคุ้มค่าความเสี่ยง รักษามาตรฐานนี้ไว้ครับ',

    insight_more_title: 'เก็บข้อมูลเพิ่มอีกนิด',
    insight_more_desc_1: 'ข้อมูลปัจจุบัน (',
    insight_more_desc_2: ' ไม้) ยังน้อยเกินไปที่จะสรุปสถิติได้แม่นยำ เทรดให้ครบ 30-50 ไม้แล้วมาดูใหม่ครับ',

    // New Optimizations
    insight_sniper_title: 'เข้าคมเหมือนจับวาง (Sniper Entry)',
    insight_sniper_desc: 'สุดยอด! คุณเข้าแม่นมาก ไม้ที่ชนะกำไรเฉลี่ยสูงกว่าไม้แพ้ถึง {ratio} เท่า (R:R จริงดีเยี่ยม)',
    
    insight_consistency_title: 'ความสม่ำเสมอดีเยี่ยม (Consistency)',
    insight_consistency_desc: 'กราฟกำไรของคุณนิ่งมาก (Low Std Dev) แสดงว่าคุมอารมณ์และขนาดไม้ได้ดีมาก',
    
    insight_trend_rider_title: 'กินเทรนด์คำใหญ่ (Trend Rider)',
    insight_trend_rider_desc: 'คุณถือไม้กำไรได้นานกว่าไม้ขาดทุน (เวลา > {ratio}เท่า) นี่คือกุญแจสู่ความรวยครับ',
    
    insight_recovery_title: 'ใจสู้ กู้พอร์ตได้ (Fighter Spirit)',
    insight_recovery_desc: 'คุณกู้พอร์ตกลับมาจากจุดต่ำสุดได้สำเร็จ แสดงถึงจิตใจที่แข็งแกร่ง ไม่ยอมแพ้',
    
    insight_sqn_super_title: 'ระบบเทพ (Holy Grail?)',
    insight_sqn_super_desc: 'ค่าคุณภาพระบบ (SQN) ของคุณอยู่ที่ {score} (ระดับยอดเยี่ยม) ระบบนี้ทำเงินได้จริง!',
    
    insight_sqn_good_title: 'ระบบดี (Good System)',
    insight_sqn_good_desc: 'ค่า SQN อยู่ที่ {score} (ระดับดี) พัฒนาต่อไป รวยได้แน่นอน',

    insight_session_master_title: 'เจ้าพ่อตลาด {session}',
    insight_session_master_desc: 'คุณทำผลงานได้ดีที่สุดในช่วง {session} โฟกัสเวลานี้ หนักๆ เลย',

    insight_selective_title: 'เน้นคุณภาพ (Selective Trader)',
    insight_selective_desc: 'เทรดน้อยแต่ต่อยหนัก อัตราชนะสูง R:R ดี นี่คือสไตล์ของมืออาชีพ',

    insight_defense_title: 'เกมรับเหนียวแน่น (Defense Master)',
    insight_defense_desc: 'คุณไม่เคยปล่อยให้การขาดทุนบานปลาย ขาดทุนต่อไม้ต่ำมาก รักษาเงินต้นได้ดีเยี่ยม',

    insight_improving_title: 'พัฒนาการดีขึ้น (Improving)',
    insight_improving_desc: '5 ไม้ล่าสุด ผลงานดีกว่าค่าเฉลี่ยรวม มาถูกทางแล้วครับ',
  },
  en: {
    // Navbar
    nav_title: 'Trading Journal',
    nav_record: 'Record Trade',
    nav_dashboard: 'Dashboard',
    lang_btn: '🇹🇭 ไทย', 

    // Home Page
    page_title: 'Record Trade',
    page_subtitle: 'Systematically record your trading journey',
    section_details: 'Trade Details',
    section_psycho: 'Psychology & Discipline',
    
    // Form Labels
    label_symbol: 'Symbol',
    label_open_date: 'Open Date',
    label_open_time: 'Open Time',
    label_close_date: 'Close Date',
    label_close_time: 'Close Time',
    label_direction: 'Direction',
    label_position: 'Position Size (Troy Oz)',
    label_entry: 'Entry Price',
    label_exit: 'Exit Price',
    label_sl: 'Stop Loss',
    label_tp: 'Take Profit',
    label_strategy: 'Strategy',
    label_emotion: 'Emotion Level (1-10)',
    label_mistake: 'Main Mistake',
    label_plan: 'Followed Plan?',
    label_notes: 'Notes',
    
    // Placeholders & Options
    ph_position: 'e.g. 100 (1 Lot), 10 (0.1 Lot)',
    ph_emotion: '1 = Calm | 10 = Fear/Greed',
    ph_notes: 'Why enter/exit? Market conditions?',
    opt_optional: '(optional)',
    opt_no_mistake: 'No Mistake',

    // Dropdown Values
    val_buy: 'Buy',
    val_sell: 'Sell',
    val_yes: 'Yes',
    val_no: 'No',

    // Messages
    msg_auto_calc: 'P&L, P&L%, R:R and Holding Time are calculated automatically.',
    btn_save: 'Save Trade',
    btn_saving: 'Saving...',
    msg_success: '✅ Trade saved successfully!',
    msg_error: '❌ Error occurred: ',
    msg_fail: '❌ Failed to save trade',
    msg_loading: 'Loading...',

    // --- Dashboard ---
    dash_title: 'Trading Dashboard',
    dash_subtitle: 'Analyze and improve your trading with insights',
    btn_refresh: '↻ Refresh Data',
    btn_refreshing: 'Refreshing...',

    // Sections
    dash_table_title: '📝 All Trades',
    dash_chart_title: '⏰ Trading Hours Chart',
    dash_chart_legend: 'Blue = Avg Entry · Orange = Avg P&L',
    dash_perf_title: '📈 Performance Overview',
    dash_risk_title: '🛡️ Risk Management',
    dash_psycho_title: '🧠 Psychology & Behavior',
    dash_strat_title: '🎯 Strategy Analysis',

    // Stats Labels & Units
    stat_total_trades: 'Total Trades',
    stat_win_rate: 'Win Rate',
    stat_total_pnl: 'Total P&L',
    stat_profit_factor: 'Profit Factor',
    stat_avg_rr: 'Avg Risk:Reward',
    stat_max_dd: 'Max Drawdown', 
    stat_plan_adherence: 'Plan Adherence',
    stat_common_mistake: 'Common Mistake',
    stat_emotion_impact: 'Emotion Impact',
    stat_best_strategy: 'Best Strategy',
    stat_avg_win: 'Avg Win',
    stat_avg_loss: 'Avg Loss',

    // Chart Labels
    chart_avg_entry: 'Avg Entry',
    chart_avg_pnl: 'Avg P&L',

    // Units
    unit_w: 'W',
    unit_l: 'L',
    unit_be: 'BE',
    unit_times: 'times',
    unit_trades: 'trades',

    // Stats Notes
    stat_target_winrate: 'Target: ≥50%',
    stat_target_pf: 'Target: ≥1.5 (Good), ≥2.0 (Great)',
    stat_target_rr: 'Target: ≥2:1 (Great), ≥1.5:1 (Good)',
    stat_target_dd: 'Target: <15% (Good), <25% (Acceptable)',
    stat_plan_note: 'trades followed plan',
    stat_no_mistake: 'No Mistake 🎉',
    stat_emotion_note: 'Losses when High Emotion (≥7/10)',
    stat_best_strat_note: 'Min 3 trades & Win Rate ≥50% required',

    // Strategy Table Headers
    th_strategy_name: 'Strategy',
    th_trades_count: 'Trades',
    th_winrate: 'Win Rate',
    th_total_pnl: 'Total P&L',
    th_avg_pnl: 'Avg P&L',

    // TradesTable Headers
    th_no: 'No.',
    th_symbol: 'Symbol',
    th_open_date: 'Open Date',
    th_close_date: 'Close Date',
    th_open_time: 'Open Time',
    th_close_time: 'Close Time',
    th_dir: 'Dir',
    th_pos: 'Size (Oz)',
    th_entry: 'Entry',
    th_exit: 'Exit',
    th_sl: 'SL',
    th_tp: 'TP',
    th_pnl: 'P&L',
    th_pnl_pct: 'P&L %',
    th_rr: 'R:R',
    th_time: 'Time',
    th_strategy: 'Strategy',
    th_emo: 'Emo',
    th_mistake: 'Mistake',
    th_plan: 'Plan?',
    th_notes: 'Notes',
    th_del: 'Del',

    // TradesTable UI
    tt_edit_hint: 'Click cell to edit • Enter to save • Esc to cancel',
    tt_no_data: '🤷 No trades recorded yet',
    tt_btn_start: 'Start Recording',
    tt_prev: '← Previous',
    tt_next: 'Next →',
    tt_page_info: 'trades • Page',
    tt_save_success: '✅ Saved successfully',
    tt_del_success: '✅ Deleted successfully',
    tt_save_error: '❌ Failed to save',
    tt_del_error: '❌ Failed to delete',
    tt_confirm_del: 'Delete this trade?',

    // --- Trading Insights (English) ---
    insight_title: 'Deep Analytics',
    insight_sys_exp: 'System Expectancy',
    insight_per_trade: '/ Trade',
    
    // Red Flags (EN)
    insight_red_title: 'Red Flags',
    insight_streak_title: 'Stop Trading Alert',
    insight_streak_suffix: 'losses in a row',
    insight_streak_desc: 'Tilt detected! Emotional decision making is likely. Rule: "Walk Away" for 30 mins to reset.',
    
    insight_fattail_title: 'Fat Tail Risk',
    insight_fattail_desc_1: 'Single loss as high as',
    insight_fattail_desc_2: '(',
    insight_fattail_desc_3: 'times larger than usual). Mandatory: Use Hard Stop Loss to prevent account blow-up.',

    insight_dispo_title: 'Disposition Effect',
    insight_dispo_desc_1: 'You hold losses longer than winners by',
    insight_dispo_desc_2: 'times. Loss Aversion detected. Cut losses faster.',

    insight_emo_title: 'Emotional Trading',
    insight_emo_desc_1: 'When emotional (Level ≥ 7), your win rate drops to',
    insight_emo_desc_2: 'Meditate or pause before executing.',

    insight_disc_title: 'Cost of Indiscipline',
    insight_disc_desc_1: 'Deviating from your plan costs you',
    insight_disc_desc_2: 'per trade on average.',

    insight_dd_title: 'High Drawdown Alert',
    insight_dd_desc: 'Dangerous zone! Reduce position size by 50% immediately until capital recovers (Kelly Criterion).',
    
    insight_safe: 'No critical red flags detected. Maintain discipline. 👍',

    insight_revenge_title: 'Revenge Trading',
    insight_revenge_desc: 'Position size increased after a loss! Stop trying to "win it back" immediately.',
    
    insight_bias_title: 'Directional Bias',
    insight_bias_desc: 'Your {dir} trades perform poorly (Win Rate {rate}%). Consider avoiding this direction temporarily.',
    
    insight_rr_mismatch_title: 'Risk > Reward (Poor R:R)',
    insight_rr_mismatch_desc: 'You lose $${loss} but only make $${win}. One loss wipes out multiple wins! You must cut losses faster.',
    
    insight_no_sl_title: 'Missing Stop Loss',
    insight_no_sl_desc: 'Trades found without Stop Loss or with catastrophic loss. One mistake can wipe the account.',
    
    insight_strategy_hop_title: 'System Hopping',
    insight_strategy_hop_desc: 'Multiple strategies used recently. Focus on mastering one system.',
    
    insight_tilt_title: 'Tilt Alert',
    insight_tilt_desc: 'High frequency trading with consecutive losses detected. Stop and cool down.',
    
    insight_monday_title: 'Monday Blues',
    insight_monday_desc: 'Statistics show Mondays are your weakest day. Market open might be too volatile.',

    insight_morning_loss_title: 'Morning Volatility',
    insight_morning_loss_desc: 'First trade of the day is often a loss. Reduce size or wait for clearer setup.',

    insight_overconfidence_title: 'Overconfidence Trap',
    insight_overconfidence_desc: 'Tendency to give back profits immediately after a big win. Stay humble.',

    insight_breakeven_abuse_title: 'Premature Breakeven',
    insight_breakeven_abuse_desc: 'High rate of Breakeven trades. You might be moving SL too early out of fear.',

    // Optimization (EN)
    insight_opt_title: 'Optimization',
    
    insight_exp_title: 'System Expectancy',
    insight_exp_desc: 'On average, every trade generates',
    insight_exp_pos: '(Positive expectancy. Scalable system.)',
    insight_exp_neg: '(Negative expectancy. Fix Win Rate or R:R.)',

    insight_hour_title: 'Golden Hour',
    insight_hour_desc: 'Your most profitable window is',
    insight_hour_desc_end: 'Focus execution here.',

    insight_day_title: 'Lucky Day',
    insight_day_desc: '',
    insight_day_desc_end: 'is your highest performing day.',

    insight_hot_title: 'Hot Hand Fallacy',
    insight_hot_desc_1: 'Won',
    insight_hot_desc_2: 'in a row. Do not increase size! Overconfidence often leads to drawdowns here.',

    insight_over_title: 'Overtrading?',
    insight_over_desc_1: 'Averaging',
    insight_over_desc_2: 'trades/day with poor results. Focus on Quality over Quantity.',

    insight_good_title: 'On Track',
    insight_good_desc_1: 'Profit Factor',
    insight_good_desc_2: '(> 1.5). Risk management is solid. Keep it up.',

    insight_more_title: 'Need More Data',
    insight_more_desc_1: 'Current sample (',
    insight_more_desc_2: ' trades) is insufficient for reliable stats. Aim for 30-50 trades.',

    insight_sniper_title: 'Sniper Entry',
    insight_sniper_desc: 'Excellent Realized R:R. Avg Win is {ratio}x larger than Avg Loss.',
    
    insight_consistency_title: 'Consistency King',
    insight_consistency_desc: 'Low P&L volatility (Low Std Dev). Demonstrates strong emotional control.',
    
    insight_trend_rider_title: 'Trend Rider',
    insight_trend_rider_desc: 'You let winners run! Holding time for winners is > {ratio}x losers.',
    
    insight_recovery_title: 'Fighter Spirit',
    insight_recovery_desc: 'Successfully recovered from drawdown. Shows mental resilience.',
    
    insight_sqn_super_title: 'Holy Grail System?',
    insight_sqn_super_desc: 'SQN Score: {score} (Excellent). Highly tradeable system.',
    
    insight_sqn_good_title: 'Good System',
    insight_sqn_good_desc: 'SQN Score: {score} (Good). Sustainable profitability.',

    insight_session_master_title: '{session} Specialist',
    insight_session_master_desc: 'Best performance during {session}. Maximize this edge.',

    insight_selective_title: 'Selective Trader',
    insight_selective_desc: 'Low frequency, High Win Rate, Good R:R. Professional approach.',

    insight_defense_title: 'Defense Master',
    insight_defense_desc: ' disciplined loss cutting. Low Max Loss per trade preserves capital.',

    insight_improving_title: 'Improving Performance',
    insight_improving_desc: 'Last 5 trades outperform overall average. Momentum is building.',
  }
};

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (key: keyof typeof translations['th']) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('th');

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'th' ? 'en' : 'th'));
  };

  const t = (key: keyof typeof translations['th']) => {
    // ป้องกันบั๊กค่าว่าง ให้ return key ถ้าหาไม่เจอจริงๆ หรือค่าเป็น undefined
    return translations[language][key] !== undefined ? translations[language][key] : key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}