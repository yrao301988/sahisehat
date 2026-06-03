import re

html_file = 'web v4_temp.html'
with open(html_file, 'r', encoding='utf-8') as f:
    content = f.read()

replacements = {
    '>Guest<': ' data-i18n="guest">Guest<',
    '<span class="hide-mobile">Home</span>': '<span class="hide-mobile" data-i18n="home">Home</span>',
    '<span class="hide-mobile">Search</span>': '<span class="hide-mobile" data-i18n="search">Search</span>',
    '<span class="hide-mobile ai-text-gradient">AI Assistant</span>': '<span class="hide-mobile ai-text-gradient" data-i18n="ai_assistant">AI Assistant</span>',
    'WE CARE FOR YOU': '<span data-i18n="we_care_for_you">WE CARE FOR YOU</span>',
    '<h2 class="login-title">Welcome Back</h2>': '<h2 class="login-title" data-i18n="welcome_back">Welcome Back</h2>',
    '<p class="login-subtitle">Please enter your details to sign in</p>': '<p class="login-subtitle" data-i18n="enter_details_signin">Please enter your details to sign in</p>',
    '<label for="email">Email, Username, or Phone</label>': '<label for="email" data-i18n="email_username_phone">Email, Username, or Phone</label>',
    'placeholder="Enter your details"': 'placeholder="Enter your details" data-i18n-placeholder="enter_details"',
    '<label for="password">Password</label>': '<label for="password" data-i18n="password">Password</label>',
    'placeholder="Enter your password"': 'placeholder="Enter your password" data-i18n-placeholder="enter_password"',
    'Remember me\n                            </label>': '<span data-i18n="remember_me">Remember me</span>\n                            </label>',
    '>Forgot Password?<': ' data-i18n="forgot_password">Forgot Password?<',
    'Sign In <i': '<span data-i18n="sign_in">Sign In</span> <i',
    '>\n                            Login with OTP\n                        </button>': ' data-i18n="login_otp">\n                            Login with OTP\n                        </button>',
    'Or sign in with': '<span data-i18n="or_sign_in_with">Or sign in with</span>',
    'Don\'t have an account?': '<span data-i18n="no_account">Don\'t have an account?</span>',
    '>Sign up<': ' data-i18n="sign_up">Sign up<',
    '<h2 class="login-title">Create Account</h2>': '<h2 class="login-title" data-i18n="create_account">Create Account</h2>',
    '<p class="login-subtitle">Join us and start your journey</p>': '<p class="login-subtitle" data-i18n="join_us">Join us and start your journey</p>',
    '<label for="reg-name">Full Name</label>': '<label for="reg-name" data-i18n="full_name">Full Name</label>',
    'placeholder="John Doe"': 'placeholder="John Doe" data-i18n-placeholder="john_doe"',
    '<label for="reg-email">Email or Phone</label>': '<label for="reg-email" data-i18n="email_or_phone">Email or Phone</label>',
    'placeholder="Enter contact info"': 'placeholder="Enter contact info" data-i18n-placeholder="enter_contact_info"',
    '<label for="reg-password">Password</label>': '<label for="reg-password" data-i18n="password">Password</label>',
    'placeholder="Create a password"': 'placeholder="Create a password" data-i18n-placeholder="create_password"',
    'Sign Up <i': '<span data-i18n="sign_up_btn">Sign Up</span> <i',
    'Or sign up with': '<span data-i18n="or_sign_up_with">Or sign up with</span>',
    'Already have an account?': '<span data-i18n="already_have_account">Already have an account?</span>',
    '>Sign In<': ' data-i18n="sign_in">Sign In<',
    '<h2 class="login-title">OTP Login</h2>': '<h2 class="login-title" data-i18n="otp_login">OTP Login</h2>',
    '<p class="login-subtitle" id="otpSubtitle">Enter your mobile phone number</p>': '<p class="login-subtitle" id="otpSubtitle" data-i18n="enter_mobile">Enter your mobile phone number</p>',
    '<label for="otp-phone">Mobile Number</label>': '<label for="otp-phone" data-i18n="mobile_number">Mobile Number</label>',
    'placeholder="Enter mobile number"': 'placeholder="Enter mobile number" data-i18n-placeholder="enter_mobile_placeholder"',
    '<label for="otp-code">Enter OTP</label>': '<label for="otp-code" data-i18n="enter_otp">Enter OTP</label>',
    'placeholder="Enter 4-digit OTP"': 'placeholder="Enter 4-digit OTP" data-i18n-placeholder="enter_4_digit_otp"',
    'Get OTP <i': '<span data-i18n="get_otp">Get OTP</span> <i',
    'Verify & Sign In <i': '<span data-i18n="verify_sign_in">Verify & Sign In</span> <i',
    '> Back to Login<': '><span data-i18n="back_to_login">Back to Login</span><',
    '>\n                    OUR SERVICES</p>': ' data-i18n="our_services">\n                    OUR SERVICES</p>',
    '<span>Dashboard</span>': '<span data-i18n="dashboard">Dashboard</span>',
    '<span>Government Health Schemes</span>': '<span data-i18n="gov_schemes">Government Health Schemes</span>',
    '<span>Nearby Public Health Centre</span>': '<span data-i18n="nearby_phc">Nearby Public Health Centre</span>',
    '<span>Appointments</span>': '<span data-i18n="appointments">Appointments</span>',
    '<span>My Health Records</span>': '<span data-i18n="my_records">My Health Records</span>',
    '<span>Connect Family</span>': '<span data-i18n="connect_family">Connect Family</span>',
    '<span>Edit Profile</span>': '<span data-i18n="edit_profile">Edit Profile</span>',
    '<span>Sign Out</span>': '<span data-i18n="sign_out">Sign Out</span>',
    '>Your health is our concern<': ' data-i18n="slogan">Your health is our concern<',
    '>\n                                        Upcoming Appointment</h3>': ' data-i18n="upcoming_appointment">\n                                        Upcoming Appointment</h3>',
    '>\n                                    Manage\n                                </button>': ' data-i18n="manage">\n                                    Manage\n                                </button>',
    'Medical\n                                        Records': '<span data-i18n="medical_records">Medical\n                                        Records</span>',
    '>Your data is private and secure<': ' data-i18n="data_secure">Your data is private and secure<',
    '> Locked\n                                </div>': '><span data-i18n="locked">Locked</span>\n                                </div>',
    '\n                                        Online\n                                    </span>': '\n                                        <span data-i18n="online">Online</span>\n                                    </span>',
    '>Connect with Anganwadi<': ' data-i18n="connect_anganwadi">Connect with Anganwadi<',
    '>\n                                        Instantly reach your local ASHA\n                                        worker or doctor for urgent queries.\n                                    </p>': ' data-i18n="reach_asha">\n                                        Instantly reach your local ASHA\n                                        worker or doctor for urgent queries.\n                                    </p>',
    'Call Now\n                                        </button>': '<span data-i18n="call_now">Call Now</span>\n                                        </button>',
    'Message\n                                        </button>': '<span data-i18n="message">Message</span>\n                                        </button>',
    '>Highly\n                                                            Recommended • Eligible<': ' data-i18n="highly_recommended">Highly\n                                                            Recommended • Eligible<',
    '>\n                                                            Ayushman Bharat (PM-JAY)</h3>': ' data-i18n="ayushman_bharat">\n                                                            Ayushman Bharat (PM-JAY)</h3>',
    'Last date to apply: Open Enrollment\n                                                        </p>': '<span data-i18n="last_date_open">Last date to apply: Open Enrollment</span>\n                                                        </p>',
    '>\n                                                    Benefits:</h4>': ' data-i18n="benefits">\n                                                    Benefits:</h4>',
    '>\n                                                    Provides a cashless health cover of ₹5 lakh per family per year for\n                                                    secondary and tertiary care hospitalization across public and\n                                                    empaneled private hospitals.</p>': ' data-i18n="benefit_ayushman">\n                                                    Provides a cashless health cover of ₹5 lakh per family per year for\n                                                    secondary and tertiary care hospitalization across public and\n                                                    empaneled private hospitals.</p>',
    '>\n                                                    Eligibility Criteria:</h4>': ' data-i18n="eligibility">\n                                                    Eligibility Criteria:</h4>',
    '>Families listed in the SECC 2011 database.<': ' data-i18n="eligibility_secc">Families listed in the SECC 2011 database.<',
    '>Lack of a pucca house or regular salaried job.<': ' data-i18n="eligibility_house">Lack of a pucca house or regular salaried job.<',
    '>Belongs to designated vulnerable socio-economic categories.<': ' data-i18n="eligibility_vulnerable">Belongs to designated vulnerable socio-economic categories.<',
    '>State\n                                                            Scheme • Eligible<': ' data-i18n="state_scheme">State\n                                                            Scheme • Eligible<',
    '>\n                                                            State Jan Arogya Yojana</h3>': ' data-i18n="state_jan_arogya">\n                                                            State Jan Arogya Yojana</h3>',
    'Last date to apply: 30th Nov\n                                                        </p>': '<span data-i18n="last_date_nov">Last date to apply: 30th Nov</span>\n                                                        </p>',
    '>\n                                                    Provides comprehensive medical coverage for identified severe\n                                                    illnesses requiring hospitalization, surgeries, and therapies.</p>': ' data-i18n="benefit_state">\n                                                    Provides comprehensive medical coverage for identified severe\n                                                    illnesses requiring hospitalization, surgeries, and therapies.</p>',
    '>Resident of the state holding a valid ration card.<': ' data-i18n="eligibility_resident">Resident of the state holding a valid ration card.<',
    '>Family income below state-defined poverty line threshold.<': ' data-i18n="eligibility_income">Family income below state-defined poverty line threshold.<',
    'Apply Now <i': '<span data-i18n="apply_now">Apply Now</span> <i',
    'Official Page\n                                        </a>': '<span data-i18n="official_page">Official Page</span>\n                                        </a>',
    'View All Schemes <i': '<span data-i18n="view_all_schemes">View All Schemes</span> <i',
    '>Authentication Required<': ' data-i18n="auth_required">Authentication Required<',
    '>Please verify your identity to access your private health records.<': ' data-i18n="verify_identity">Please verify your identity to access your private health records.<',
    'placeholder="Enter PIN or Password"': 'placeholder="Enter PIN or Password" data-i18n-placeholder="enter_pin"',
    '>\n                    Unlock Records\n                </button>': ' data-i18n="unlock_records">\n                    Unlock Records\n                </button>',
    '>OR USE BIOMETRICS<': ' data-i18n="or_use_biometrics">OR USE BIOMETRICS<',
    '>Book\n                Appointment<': ' data-i18n="book_appointment">Book\n                Appointment<',
    '>Select\n                        Date<': ' data-i18n="select_date">Select\n                        Date<',
    '>Select\n                        Time<': ' data-i18n="select_time">Select\n                        Time<',
    '>\n                    Confirm Booking\n                </button>': ' data-i18n="confirm_booking">\n                    Confirm Booking\n                </button>',
    '<p>You can get everything you want if you work hard, trust the process, and stick to the plan.\n                        </p>': '<p data-i18n="auth_quote">You can get everything you want if you work hard, trust the process, and stick to the plan.\n                        </p>'
}

for old, new in replacements.items():
    content = content.replace(old, new)

langs = {
    'English': 'en',
    'हिंदी (Hindi)': 'hi',
    'বাংলা (Bengali)': 'bn',
    'मराठी (Marathi)': 'mr',
    'తెలుగు (Telugu)': 'te',
    'தமிழ் (Tamil)': 'ta',
    'ગુજરાતી (Gujarati)': 'gu',
    'اردو (Urdu)': 'ur',
    'ಕನ್ನಡ (Kannada)': 'kn',
    'ଓଡ଼ିଆ (Odia)': 'or',
    'മലയാളം (Malayalam)': 'ml',
    'ਪੰਜਾਬੀ (Punjabi)': 'pa',
    'অসমীয়া (Assamese)': 'as',
    'मैथिली (Maithili)': 'mai',
    'ᱥᱟᱱᱛᱟᱲᱤ (Santali)': 'sat',
    'کأشُر (Kashmiri)': 'ks',
    'कोंकणी (Konkani)': 'kok',
    'سنڌي (Sindhi)': 'sd',
    'डोगरी (Dogri)': 'doi',
    'ꯃꯤꯇꯩꯂꯣꯟ (Manipuri)': 'mni',
    'बड़ो (Bodo)': 'brx',
    'संस्कृतम् (Sanskrit)': 'sa'
}

for lang_text, code in langs.items():
    content = content.replace(f'<button class="lang-item">{lang_text}</button>', f'<button class="lang-item" data-lang="{code}">{lang_text}</button>')

script_tag = '<script src="translations.js"></script>\n</head>'
if '<script src="translations.js"></script>' not in content:
    content = content.replace('</head>', script_tag)

js_script = """
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const langItems = document.querySelectorAll('.lang-item');
            const langBtn = document.getElementById('langBtn');
            const langDropdown = document.getElementById('langDropdown');
            
            if (langBtn) {
                langBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    langDropdown.classList.toggle('show');
                });
            }
            
            document.addEventListener('click', (e) => {
                if (langDropdown && !langDropdown.contains(e.target) && e.target !== langBtn) {
                    langDropdown.classList.remove('show');
                }
            });
            
            langItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    const langCode = e.target.getAttribute('data-lang');
                    if (langCode) {
                        updateLanguage(langCode);
                    }
                    if (langDropdown) langDropdown.classList.remove('show');
                });
            });
            
            function updateLanguage(lang) {
                if (!window.translations || !window.translations[lang]) return;
                
                document.querySelectorAll('[data-i18n]').forEach(el => {
                    const key = el.getAttribute('data-i18n');
                    if (window.translations[lang][key]) {
                        el.innerText = window.translations[lang][key];
                    }
                });
                
                document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
                    const key = el.getAttribute('data-i18n-placeholder');
                    if (window.translations[lang][key]) {
                        el.placeholder = window.translations[lang][key];
                    }
                });
            }
        });
    </script>
"""

if 'updateLanguage' not in content:
    content = content.replace('</body>', js_script + '\n</body>')

with open(html_file, 'w', encoding='utf-8') as f:
    f.write(content)

print("Injected data-i18n attributes successfully.")
