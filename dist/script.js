var scanlines = $('.scanlines');
var tv = $('.tv');
let user = 'root';
let emp = ["Bob", "Sally", "Fred", "Janica"];
let status = "status";
let cli = user + '@anuralabs:~# ';
let login = false;
let loginName = false;
let onList = false;
let approvedFor = 0;
const fantomId = '0x61';
function exit() {
  $('.tv').addClass('collapse');
  term.disable();
}

// ref: https://stackoverflow.com/q/67322922/387194
var __EVAL = (s) => eval(`void (__EVAL = ${__EVAL}); ${s}`);

var term = $('#terminal').terminal(
    function (command, term) {
    var cmd = $.terminal.parse_command(command);
        if (login == false && loginName == false && cmd.name != 'anura') {
            term.echo("You must login before interacting with the terminal!");
            term.echo("Enter Login Username: ");
        }
    else if (login == false && loginName == false && cmd.name == 'anura') {
        term.echo("Please enter your password:");
        loginName = true;
    }
    else if (login == false && loginName == true && cmd.name != 'ribt') {term. echo("You have entered the wrong password. Please try again!")}    
    else if (login == false && loginName == true && cmd.name == 'ribt') {
        term.echo("You have successfully logged in!");
        login = true;
    } 
        
    else if (cmd.name == 'password' || cmd.name == 'systemCTL' || cmd.name == 'su' || cmd.name == 'joe' || cmd.name == 'lab'
            || cmd.name == 'kotor' || cmd.name == 'staff' || cmd.name == 'commands' || cmd.name == 'lab' || cmd.name == 'numberOfSurvivors') {
        term.echo("Make sure to use () after your command to execute!");    
        }   
      else if (cmd.name === 'exit') {
      exit();
    } else if (cmd.name === 'echo') {
      term.echo(cmd.rest);
    } else if (command !== '') {
      try {
        var result = __EVAL(command);
        if (result && result instanceof $.fn.init) {
          term.echo('<#jQuery>');
        } else if (result && typeof result === 'object') {
          tree(result);
        } else if (result !== undefined) {
          term.echo(new String(result));
        }
      } catch (e) {
        term.error(new String(e));
      }
    }
  },
    {
        name: 'anura_labs',
        onResize: set_size,
        exit: false,
        enabled: $('body').attr('onload') === undefined,
        onInit: function () {

                set_size();
                $('.terminal-output').children(0)[0].remove();
                this.echo(
                    '....###....##....##.##.....##.########.....###.......##..........###....########...######....'
                );
                this.echo(
                    `...##.##...###...##.##.....##.##.....##...##.##......##.........##.##...##.....##.##....##...`
                );
                this.echo(
                    '..##...##..####..##.##.....##.##.....##..##...##.....##........##...##..##.....##.##.........'
                );
                this.echo(
                    '.##.....##.##.##.##.##.....##.########..##.....##....##.......##.....##.########...######....'
                );
                this.echo(
                    '.#########.##..####.##.....##.##...##...#########....##.......#########.##.....##.......##...'
                );
                this.echo(
                    '.##.....##.##...###.##.....##.##....##..##.....##....##.......##.....##.##.....##.##....##...'
                );
                this.echo(
                    '.##.....##.##....##..#######..##.....##.##.....##....########.##.....##.########...######....'
                );
                this.echo(
                    '                                                                 Building for a Better Future'
                );
                this.echo(
                    '                                                                                             '
                );
                this.echo('Type [[b;#fff;]exit] to return to home');
                this.echo('Type [[b;#fff;]clear] to clear the console');
            this.echo('Type [[b;#fff;]commands()] to see commands');
            this.echo('-----------------------------------------------');
            this.echo('Enter Login Username:')
            
        
        },
        onClear: function () {
            console.log(this.find('video').length);
            this.find('video').map(function () {
                console.log(this.src);
                return this.src;
            });
        },
        prompt: cli,
    }
);
if (!term.enabled()) {
  term.find('.cursor').addClass('blink');
}

function commands() {
    term.echo('[[b;#fff;]info()] - View Info');
    term.echo('[[b;#fff;]loadWeb3()] - Connect your Metamask Wallet');
  term.echo('[[b;#fff;]approve()] - Approve spending your Blood Tokens for Badge');
  term.echo('[[b;#fff;]mintBadge()] - Generate your Badge to Escape');
    term.echo('[[b;#fff;]mintToken()] - Mint Blood Points');
    term.echo('[[b;#fff;]myBalance()] - Return your current Blood Token Balance');
    term.echo('[[b;#fff;]numberOfSurvivors()] - Return your current Blood Token Balance');
  term.echo('[[b;#fff;]lab()] - Open Lab Terminal');
  term.echo('[[b;#fff;]headshot()] - Take a picture for your Badge!');
}

function set_size() {
  // for window height of 170 it should be 2s
  var height = $(window).height();
  var width = $(window).width();
  var time = (height * 2) / 170;
  scanlines[0].style.setProperty('--time', time);
  tv[0].style.setProperty('--width', width);
  tv[0].style.setProperty('--height', height);
}

function tree(obj) {
  term.echo(treeify.asTree(obj, true, true));
}

var constraints = {
    audio: false,
    video: {
        width: { ideal: 1280 },
        height: { ideal: 1024 },
        facingMode: "environment"
    }
};



function headshot() {
  term.echo("Allow access to your webcam for picture verification!");
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    term.echo("Say cheese!")
    console.log("Taking picture...")
        term.pause();
        var media = navigator.mediaDevices.getUserMedia(constraints);
        media.then(function(mediaStream) {
            const mediaStreamTrack = mediaStream.getVideoTracks()[0];
            const imageCapture = new ImageCapture(mediaStreamTrack);
            return imageCapture.takePhoto();
        }).then(function (blob) {
          console.log(URL.createObjectURL(blob));
            term.echo('<img src="' + URL.createObjectURL(blob) + '" class="self"/>', {
                raw: true,
                finialize: function(div) {
                    div.find('img').on('load', function() {
                        URL.revokeObjectURL(this.src);
                    });
                }
            }).resume();
        }).catch(function(error) {
          term.error('Device Media Error: ' + error);
          term.pause();
          clear();
        });
    }
}

function clear() {
    term.clear();   
}

function lab() {
    { term.echo("systemCTL() password() AnuraDAO() staff() addToStaff() headShot() web3()") };
    { term.echo("Some method calls in the lab require arguments.") };
    { term.echo("Pass arguments like this: command(<arg>)") };
}; 

function web3() {
    term.echo("ethereum.chainId || ethereum.selectedId || bloodTknAddr || lastAliveAddr")
}

function addToStaff(name) {
  term.echo("Adding you to the staff list...")
  emp.push(name);
  onList = true;
}

var logs = "logs";
var override = 'override';

function systemCTL(command) {
    if (command == logs) {
        term.echo("[[b;#fff;]Joe:] There has been a containment breach in the lab...");
        term.echo("[[b;#fff;]Logan:] We have to get the employees out of here!");
        term.echo("[[b;#fff;]Joe:] Unfortunately it is to late, we can only allow employees with Level 6 Badge Clearance to leave...");
        term.echo("[[b;#fff;]Logan:] If these people dont get out in the next 72 hours they will die");
        term.echo("[[b;#fff;]Joe:] I have to go... good luck.");
        term.echo("-----------------------------------------------------------------------");
        term.echo("-----------------------------------------------------------------------");
        term.echo("[[b;#fff;]Logan:] If you are reading this, I have overridden the system, you need 50 tokens to mint a badge to escape!");
        term.echo("Save yourselves before it is to late! It is not safe here anymore!");
    }
    else if (command == override) {
        if (user == 'Joe') {
            term.echo("Use command Kotor(39) to earn 24 Hours of protection...");
            term.echo("You can only use this command once, and you must not currently have protected status to successfully earn protection.");
        }
        else {
            term.echo("[[b;#fff;]You do not have override clearance!]");
        }
    }
    else if (command == "ping 69.420.69.420") {
        term.echo("PING 69.420.69.40");
        term.echo("69 bytes from maa05s04-in-f4.1e100.net (69.420.69.420)")
        term.echo("69 bytes from maa05s04-in-f4.1e100.net (69.420.69.420)")
        term.echo("69 bytes from maa05s04-in-f4.1e100.net (69.420.69.420)")
        term.echo("69 bytes from maa05s04-in-f4.1e100.net (69.420.69.420)")
        term.echo("-- 69.420.69.420 ping statistics --")
        term.echo("4 packets transmitted, 4 recieved, 0% packet loss, time 3042ms");
        term.echo("rtt min/avg/max/mdev = 2.696/2.420/2.469/0.069 ms")   
    }

    else {
        term.echo("Try using a valid subcommand");
        term.echo("logs override ping <ip>");
    }
    
    
}

function staff(sub) {
    if (sub == list) {
        term.echo("[[b;#fff;] Anura Lab Staff List] ")
        term.echo("[[b;#fff;] Dr.] Logan ");
        term.echo("[[b;#fff;] Dr.] Kotor ");
        term.echo("[[b;#fff;] Dr.] Joe");
        term.echo("[[b;#fff;] Dr.] Tbx");
        term.echo("[[b;#fff;] Dr.] Mccloud");
        term.echo("[[b;#fff;] Other Lab Staff: ")
        var i = 0;
        for (i = 0; i < emp.length; i++) {
            term.echo("  "+emp[i]);
        }
    }
    else if (sub == status) {
        term.echo("Employee Status is not available to this user...");
        
    }
    else {
        term.echo("Use subcommand < list > to check staff list.");
        term.echo("Use subcommand < status > to see employee status");
    }

};

let list = "list";

function password(secret) {
    if (
      secret ==
      '01000001 01101110 01110101 01110010 01100001  01001100 01100001 01100010 01110011'
    ) {
        term.echo('Use keyword FrogsProtecFrogs to earn protection for 24 hours');
        term.echo('You can not use twice. Do not use if currently under protection.');
    }
    else if (secret == "646") {
        term.echo("Use keyword MoreThanYourAverageJoe to recieve protection!");
    }
    else {
      term.echo('Wrong Password');
    }
}


function AnuraDAO() {
  term.echo("|   __   ___.--'_`.     .'_`--.___   __   |");
  term.echo("|  ( _`.'. -   'o` )   ( 'o`   - .`.'_ )  |");
  term.echo("|  |_.'_'      _.-'     `-._      `_`./_  |");
  term.echo("|  ( |`. )    //|`         '/|    ( .'/ ) |");
    term.echo("|  |_`-'`---'||__,       ,__//`---'`-'_/  |");
    term.echo("-------------------------------------------");
    term.echo('For Game Assistance Join our Community Discord!');
    term.echo('https://discord.gg/yFY84Qm25F');
    term.echo("You can also follow us on Twitter:");
    term.echo('https://twitter.com/AnuraDao');
}

function joe() {
  term.echo(
    '01000001 01101110 01110101 01110010 01100001  01001100 01100001 01100010 01110011'
  );
}

function su(name, pw) {
    if (name == 'Joe' && pw == '01000001 01101110 01110101 01110010 01100001  01001100 01100001 01100010 01110011') {
        user = 'Joe';
        term.echo("Hello Joe! You have have administrator priviledges!");    
    }
    else { 
        term.echo("Enter a matching User and Password");
    }
}

function info() {
  term.echo('## Anura Labs in currently under lockdown ##');
  term.echo(
    'There have been reports of widespread infection outside of the containment zone'
  );
    term.echo('Only qualified employees with badges are allowed to leave the lab');

    term.echo('Use this terminal for additional information and updates...');
}

function tbx() {
  term.echo('             (()))');
  term.echo('            /|x x|');
  term.echo('           / ( - )');
  term.echo('   ___.-._/ /     ');
  term.echo("  /=`_' - '/ !!   ");
  term.echo('  (-{-_-_-}    !  ');
  term.echo('    {_-_-_}   !   ');
  term.echo('    }-_-_-}       ');
  term.echo('    {-_|-_}       ');
  term.echo('    {-_|_-}       ');
  term.echo('    {_-|-_}       ');
  term.echo('    {_-|-_}  TBX  ');
  term.echo('____%%@ @%%_______ ');
}

function kotor(scrt) {
    if(scrt== "39") {
        term.echo("Use password RIBT! to earn 5 free blood points!");
    }
    else if (scrt == "3042ms") {
        term.echo("Pass in chain Id to earn protection for 24 Hours! You can only use once!");
    }
  term.echo('                             888     d8b         ');
  term.echo('                             888     Y8P         ');
  term.echo('                             888                 ');
  term.echo('88888888 .d88b. 88888b.d88b. 88888b. 888 .d88b.  ');
  term.echo('   d88P d88  88b888  888  88b888  88b888d8P  Y8b ');
  term.echo('  d88P  888  888888  888  888888  88888888888888 ');
  term.echo(' d88P   Y88..88P888  888  888888 d88P888Y8b.     ');
  term.echo('88888888 `Y88P` 888  888  88888888P  888 `Y8888  ');
    term.echo('                                                 ');
    term.echo('How long does it take to ping 69.420.69.420?');
}

function hint() {
  term.echo('ASCII Character Codes:');
  term.echo('z = ASCII 122');
  term.echo('o = ASCII 111');
  term.echo('m = ASCII 109');
  term.echo('b = ASCII 98');
  term.echo('i = ASCII 105');
  term.echo('e = ASCII 101');
}

function mccloud() {
    term.echo("\   _         ");
    term.echo("\  ( \\nnnn /  / \ ");
    term.echo("\  (`     \\  /  \ ");
    term.echo("\   `-.    \\/ \ ");
    term.echo("\      `,   ) \ ");
    term.echo("\        ``` \ ");
}

function logan() {
  term.echo('______________$$$$$$$$$$____________________');
  term.echo('_____________$$__$_____$$$$$________________');
  term.echo('_____________$$_$$__$$____$$$$$$$$__________');
  term.echo('____________$$_$$__$$$$$________$$$_________');
  term.echo('___________$$_$$__$$__$$_$$$__$$__$$________');
  term.echo('___________$$_$$__$__$$__$$$$$$$$__$$_______');
  term.echo('____________$$$$$_$$_$$$_$$$$$$$$_$$$_______');
  term.echo('_____________$$$$$$$$$$$$$_$$___$_$$$$______');
  term.echo('________________$$_$$$______$$$$$_$$$$______');
  term.echo('_________________$$$$_______$$$$$___$$$_____');
  term.echo('___________________________$$_$$____$$$$____');
  term.echo('___________________________$$_$$____$$$$$___');
  term.echo('__________________________$$$$$_____$$$$$$__');
  term.echo('_________________________$__$$_______$$$$$__');
  term.echo('________________________$$$_$$________$$$$$_');
  term.echo('________________________$$$___________$$$$$_');
  term.echo('_________________$$$$___$$____________$$$$$$');
  term.echo('__$$$$$$$$____$$$$$$$$$$_$____________$$$_$$');
  term.echo('_$$$$$$$$$$$$$$$______$$$$$$$___$$____$$_$$$');
  term.echo('$$________$$$$__________$_$$$___$$$_____$$$$');
  term.echo('$$______$$$_____________$$$$$$$$$$$$$$$$$_$$');
  term.echo('$$______$$_______________$$_$$$$$$$$$$$$$$$_');
  term.echo('$$_____$_$$$$$__________$$$_$$$$$$$$$$$$$$$_');
  term.echo('$$___$$$__$$$$$$$$$$$$$$$$$__$$$$$$$$$$$$$__');
  term.echo('$$_$$$$_____$$$$$$$$$$$$________$$$$$$__$___');
  term.echo('$$$$$$$$$$$$$$_________$$$$$______$$$$$$$___');
  term.echo('$$$$_$$$$$______________$$$$$$$$$$$$$$$$____');
  term.echo('$$__$$$$_____$$___________$$$$$$$$$$$$$_____');
  term.echo('$$_$$$$$$$$$$$$____________$$$$$$$$$$_______');
  term.echo('$$_$$$$$$$hg$$$____$$$$$$$$__$$$____________');
  term.echo('$$$$__$$$$$$$$$$$$$$$$$$$$$$$$______________');
  term.echo('$$_________$$$$$$$$$$$$$$$__________________');
  term.echo('                                            ');
}

/////////////////////////////////////////////////////////////////////////////////
/* ▄         ▄  ▄▄▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄▄        ▄▄▄▄▄▄▄▄▄▄▄ 
▐░▌       ▐░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░▌      ▐░░░░░░░░░░░▌
▐░▌       ▐░▌▐░█▀▀▀▀▀▀▀▀▀ ▐░█▀▀▀▀▀▀▀█░▌      ▀▀▀▀▀▀▀▀▀█░▌
▐░▌       ▐░▌▐░▌          ▐░▌       ▐░▌               ▐░▌
▐░▌   ▄   ▐░▌▐░█▄▄▄▄▄▄▄▄▄ ▐░█▄▄▄▄▄▄▄█░▌      ▄▄▄▄▄▄▄▄▄█░▌
▐░▌  ▐░▌  ▐░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░▌      ▐░░░░░░░░░░░▌
▐░▌ ▐░▌░▌ ▐░▌▐░█▀▀▀▀▀▀▀▀▀ ▐░█▀▀▀▀▀▀▀█░▌      ▀▀▀▀▀▀▀▀▀█░▌
▐░▌▐░▌ ▐░▌▐░▌▐░▌          ▐░▌       ▐░▌               ▐░▌
▐░▌░▌   ▐░▐░▌▐░█▄▄▄▄▄▄▄▄▄ ▐░█▄▄▄▄▄▄▄█░▌      ▄▄▄▄▄▄▄▄▄█░▌
▐░░▌     ▐░░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░▌      ▐░░░░░░░░░░░▌
 ▀▀       ▀▀  ▀▀▀▀▀▀▀▀▀▀▀  ▀▀▀▀▀▀▀▀▀▀        ▀▀▀▀▀▀▀▀▀▀▀ 
/////////////////////////////////////////////////////////////////////////////////*/

const lastAliveAddr = '0x877b6ecF1A7cEaf1efbD80Eaef5e3593fcf30de2';
const bloodTknAddr = '0x2Eb2B248DCB9a3c855378234d9809259e87b8567';

async function loadWeb3() {
    if (window.ethereum && !ethereum.selectedAddress) {
        window.web3 = new Web3(window.ethereum);
        window.ethereum.enable();
        term.echo("You have successfully connected to Web3")
        term.echo("                                                 ");
        term.echo("██╗    ██╗███████╗██████╗     ██████╗ ");
        term.echo("██║    ██║██╔════╝██╔══██╗    ╚════██╗");
        term.echo("██║ █╗ ██║█████╗  ██████╔╝     █████╔╝");
        term.echo("██║███╗██║██╔══╝  ██╔══██╗     ╚═══██╗");
        term.echo("╚███╔███╔╝███████╗██████╔╝    ██████╔╝");
        term.echo(" ╚══╝╚══╝ ╚══════╝╚═════╝     ╚═════╝ ");
        term.echo("                                      ");
    }
    else if (window.ethereum) {
        term.echo(`You are connected to Web3 via ${ethereum.selectedAddress}`);
        window.web3 = new Web3(window.ethereum);
        window.ethereum.enable();
        if (ethereum.chainId != fantomId) {
            term.echo("Please switch to the Fantom Network!");
            term.echo("                                                         ");
            term.echo("  █████▒▄▄▄       ███▄    █ ▄▄▄█████▓ ▒█████   ███▄ ▄███▓");
            term.echo("▓██   ▒▒████▄     ██ ▀█   █ ▓  ██▒ ▓▒▒██▒  ██▒▓██▒▀█▀ ██▒");
            term.echo("▒████ ░▒██  ▀█▄  ▓██  ▀█ ██▒▒ ▓██░ ▒░▒██░  ██▒▓██    ▓██░");
            term.echo("░▓█▒  ░░██▄▄▄▄██ ▓██▒  ▐▌██▒░ ▓██▓ ░ ▒██   ██░▒██    ▒██ ");
            term.echo("░▒█░    ▓█   ▓██▒▒██░   ▓██░  ▒██▒ ░ ░ ████▓▒░▒██▒   ░██▒");
            term.echo(" ▒ ░    ▒▒   ▓▒█░░ ▒░   ▒ ▒   ▒ ░░   ░ ▒░▒░▒░ ░ ▒░   ░  ░");
            term.echo(" ░       ▒   ▒▒ ░░ ░░   ░ ▒░    ░      ░ ▒ ▒░ ░  ░      ░");
            term.echo(" ░ ░     ░   ▒      ░   ░ ░   ░      ░ ░ ░ ▒  ░      ░   ")
        }
    }
        
    else {
      term.echo('You can not connect to Web3... do you have Metamask Installed?');
    } 
}



async function loadLastAliveContr() {
    await loadWeb3();
  window.lastAlive = await loadLastAlive();
  console.log('Last Alive Contract is loaded...');
}

async function loadBloodTknContr() {
    await loadWeb3();
  window.bloodToken = await loadblood();
  console.log('Blood token is loaded...');
}

async function loadblood() {
  return await new window.web3.eth.Contract(
    [
      {
        inputs: [],
        stateMutability: 'nonpayable',
        type: 'constructor',
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: 'address',
            name: 'owner',
            type: 'address',
          },
          {
            indexed: true,
            internalType: 'address',
            name: 'spender',
            type: 'address',
          },
          {
            indexed: false,
            internalType: 'uint256',
            name: 'value',
            type: 'uint256',
          },
        ],
        name: 'Approval',
        type: 'event',
      },
      {
        inputs: [
          {
            internalType: 'address',
            name: 'spender',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'amount',
            type: 'uint256',
          },
        ],
        name: 'approve',
        outputs: [
          {
            internalType: 'bool',
            name: '',
            type: 'bool',
          },
        ],
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        inputs: [
          {
            internalType: 'address',
            name: 'spender',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'subtractedValue',
            type: 'uint256',
          },
        ],
        name: 'decreaseAllowance',
        outputs: [
          {
            internalType: 'bool',
            name: '',
            type: 'bool',
          },
        ],
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        inputs: [
          {
            internalType: 'address',
            name: 'spender',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'addedValue',
            type: 'uint256',
          },
        ],
        name: 'increaseAllowance',
        outputs: [
          {
            internalType: 'bool',
            name: '',
            type: 'bool',
          },
        ],
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        inputs: [],
        name: 'mint',
        outputs: [],
        stateMutability: 'payable',
        type: 'function',
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: 'address',
            name: 'previousOwner',
            type: 'address',
          },
          {
            indexed: true,
            internalType: 'address',
            name: 'newOwner',
            type: 'address',
          },
        ],
        name: 'OwnershipTransferred',
        type: 'event',
      },
      {
        inputs: [],
        name: 'renounceOwnership',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        inputs: [
          {
            internalType: 'uint256',
            name: '_rate',
            type: 'uint256',
          },
        ],
        name: 'setRate',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        inputs: [
          {
            internalType: 'address',
            name: 'to',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'amount',
            type: 'uint256',
          },
        ],
        name: 'transfer',
        outputs: [
          {
            internalType: 'bool',
            name: '',
            type: 'bool',
          },
        ],
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: 'address',
            name: 'from',
            type: 'address',
          },
          {
            indexed: true,
            internalType: 'address',
            name: 'to',
            type: 'address',
          },
          {
            indexed: false,
            internalType: 'uint256',
            name: 'value',
            type: 'uint256',
          },
        ],
        name: 'Transfer',
        type: 'event',
      },
      {
        inputs: [
          {
            internalType: 'address',
            name: 'from',
            type: 'address',
          },
          {
            internalType: 'address',
            name: 'to',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'amount',
            type: 'uint256',
          },
        ],
        name: 'transferFrom',
        outputs: [
          {
            internalType: 'bool',
            name: '',
            type: 'bool',
          },
        ],
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        inputs: [
          {
            internalType: 'address',
            name: 'newOwner',
            type: 'address',
          },
        ],
        name: 'transferOwnership',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        inputs: [
          {
            internalType: 'address',
            name: 'owner',
            type: 'address',
          },
          {
            internalType: 'address',
            name: 'spender',
            type: 'address',
          },
        ],
        name: 'allowance',
        outputs: [
          {
            internalType: 'uint256',
            name: '',
            type: 'uint256',
          },
        ],
        stateMutability: 'view',
        type: 'function',
      },
      {
        inputs: [
          {
            internalType: 'address',
            name: 'account',
            type: 'address',
          },
        ],
        name: 'balanceOf',
        outputs: [
          {
            internalType: 'uint256',
            name: '',
            type: 'uint256',
          },
        ],
        stateMutability: 'view',
        type: 'function',
      },
      {
        inputs: [],
        name: 'decimals',
        outputs: [
          {
            internalType: 'uint8',
            name: '',
            type: 'uint8',
          },
        ],
        stateMutability: 'view',
        type: 'function',
      },
      {
        inputs: [],
        name: 'name',
        outputs: [
          {
            internalType: 'string',
            name: '',
            type: 'string',
          },
        ],
        stateMutability: 'view',
        type: 'function',
      },
      {
        inputs: [],
        name: 'owner',
        outputs: [
          {
            internalType: 'address',
            name: '',
            type: 'address',
          },
        ],
        stateMutability: 'view',
        type: 'function',
      },
      {
        inputs: [],
        name: 'symbol',
        outputs: [
          {
            internalType: 'string',
            name: '',
            type: 'string',
          },
        ],
        stateMutability: 'view',
        type: 'function',
      },
      {
        inputs: [],
        name: 'totalSupply',
        outputs: [
          {
            internalType: 'uint256',
            name: '',
            type: 'uint256',
          },
        ],
        stateMutability: 'view',
        type: 'function',
      },
    ],
    bloodTknAddr
  );
}

async function loadLastAlive() {
  return await new window.web3.eth.Contract(
    [
        {
            "inputs": [
                {
                    "internalType": "contract IERC20",
                    "name": "_blood",
                    "type": "address"
                },
                {
                    "internalType": "address",
                    "name": "_relay",
                    "type": "address"
                }
            ],
            "stateMutability": "nonpayable",
            "type": "constructor"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "owner",
                    "type": "address"
                },
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "approved",
                    "type": "address"
                },
                {
                    "indexed": true,
                    "internalType": "uint256",
                    "name": "tokenId",
                    "type": "uint256"
                }
            ],
            "name": "Approval",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "owner",
                    "type": "address"
                },
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "operator",
                    "type": "address"
                },
                {
                    "indexed": false,
                    "internalType": "bool",
                    "name": "approved",
                    "type": "bool"
                }
            ],
            "name": "ApprovalForAll",
            "type": "event"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "to",
                    "type": "address"
                },
                {
                    "internalType": "uint256",
                    "name": "tokenId",
                    "type": "uint256"
                }
            ],
            "name": "approve",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "zombieId",
                    "type": "uint256"
                },
                {
                    "internalType": "uint256",
                    "name": "victimId",
                    "type": "uint256"
                }
            ],
            "name": "bite",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "tokenId",
                    "type": "uint256"
                }
            ],
            "name": "claimVictory",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "firstInfected",
                    "type": "uint256"
                }
            ],
            "name": "initInfection",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "previousOwner",
                    "type": "address"
                },
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "newOwner",
                    "type": "address"
                }
            ],
            "name": "OwnershipTransferred",
            "type": "event"
        },
        {
            "inputs": [],
            "name": "renounceOwnership",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "to",
                    "type": "address"
                },
                {
                    "internalType": "uint256",
                    "name": "_amount",
                    "type": "uint256"
                }
            ],
            "name": "safemint",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "from",
                    "type": "address"
                },
                {
                    "internalType": "address",
                    "name": "to",
                    "type": "address"
                },
                {
                    "internalType": "uint256",
                    "name": "tokenId",
                    "type": "uint256"
                }
            ],
            "name": "safeTransferFrom",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "from",
                    "type": "address"
                },
                {
                    "internalType": "address",
                    "name": "to",
                    "type": "address"
                },
                {
                    "internalType": "uint256",
                    "name": "tokenId",
                    "type": "uint256"
                },
                {
                    "internalType": "bytes",
                    "name": "_data",
                    "type": "bytes"
                }
            ],
            "name": "safeTransferFrom",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "operator",
                    "type": "address"
                },
                {
                    "internalType": "bool",
                    "name": "approved",
                    "type": "bool"
                }
            ],
            "name": "setApprovalForAll",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "humanId",
                    "type": "uint256"
                }
            ],
            "name": "setProtection",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "from",
                    "type": "address"
                },
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "to",
                    "type": "address"
                },
                {
                    "indexed": true,
                    "internalType": "uint256",
                    "name": "tokenId",
                    "type": "uint256"
                }
            ],
            "name": "Transfer",
            "type": "event"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "from",
                    "type": "address"
                },
                {
                    "internalType": "address",
                    "name": "to",
                    "type": "address"
                },
                {
                    "internalType": "uint256",
                    "name": "tokenId",
                    "type": "uint256"
                }
            ],
            "name": "transferFrom",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "newOwner",
                    "type": "address"
                }
            ],
            "name": "transferOwnership",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "owner",
                    "type": "address"
                }
            ],
            "name": "balanceOf",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "tokenId",
                    "type": "uint256"
                }
            ],
            "name": "getApproved",
            "outputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "owner",
                    "type": "address"
                },
                {
                    "internalType": "address",
                    "name": "operator",
                    "type": "address"
                }
            ],
            "name": "isApprovedForAll",
            "outputs": [
                {
                    "internalType": "bool",
                    "name": "",
                    "type": "bool"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "name",
            "outputs": [
                {
                    "internalType": "string",
                    "name": "",
                    "type": "string"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "numberOfSurvivors",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "owner",
            "outputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "tokenId",
                    "type": "uint256"
                }
            ],
            "name": "ownerOf",
            "outputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "bytes4",
                    "name": "interfaceId",
                    "type": "bytes4"
                }
            ],
            "name": "supportsInterface",
            "outputs": [
                {
                    "internalType": "bool",
                    "name": "",
                    "type": "bool"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "symbol",
            "outputs": [
                {
                    "internalType": "string",
                    "name": "",
                    "type": "string"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "tokenId",
                    "type": "uint256"
                }
            ],
            "name": "tokenURI",
            "outputs": [
                {
                    "internalType": "string",
                    "name": "",
                    "type": "string"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        }
    ],
    lastAliveAddr
  );
}

async function mintToken(num) {
    if (num > 0 ) {
        term.echo(`You are currently minting ${num} blood tokens`);
         await loadBloodTknContr();
        window.bloodToken.methods
            .mint()
            .send({ from: ethereum.selectedAddress, value: num * (10 ** 18) });
        console.log('You are minting tokens...');
    }
    else {
        term.echo("You need to pass a valid number to mint...") 
        term.echo("mintToken(<Number>)") };
}

async function approve() {
  await loadBloodTknContr();
  window.bloodToken.methods
    .approve(lastAliveAddr, BigInt(50 * 10 ** 18))
    .send({ from: ethereum.selectedAddress });
    term.echo('Your are pending approval to mint a badge. Please wait until Metamask confirmation...');
    term.echo('Make sure you have 50 Blood Tokens to spend');
    approvedFor += 50;
}

async function mintBadge(name) {
  for (var i = 0; i < emp.length; i++){
    if (name == emp[i]) {
      onList = true;
      break;
    }
  }
    if (approvedFor >= 50 && onList == true) {
        await loadLastAliveContr();
        lastAlive.methods
            .safemint(ethereum.selectedAddress, BigInt(50 * 10 ** 18))
            .send({ from: ethereum.selectedAddress });
        term.echo(`Your Badge has been generated and sent to...`);
        term.echo(ethereum.selectedAddress);
        approvedFor -= 50;
    } else {
      term.echo("You need to Get Approved First!");
      term.echo("--------------------------------------");
      term.echo("Make sure you are on the Staff List!");
      term.echo("Then try executing approve() or addToStaff(<name>)");
      term.echo("--------------------------------------------------");
      term.echo("Make sure to pass your name into the request:");
      term.echo("mintBadge('<Name>')");
    }
}

async function bite(zombieId, victimId) {
  await loadLastAliveContr();
  window.lastAlive.methods
    .bite(zombieId, victimId)
    .send({ from: ethereum.selectedAddress });
}

async function numberOfSurvivors() {
    await loadLastAliveContr();
    if (lastAlive._address == lastAliveAddr && ethereum.chainId == fantomId) {
        var num = await window.lastAlive.methods.numberOfSurvivors().call({ from: ethereum.selectedAddress });
        term.echo(`There are ${num} survivors left`); 
    }
    else {
        term.echo('Something went wrong!')
    }
}

async function myBalance() {
    await loadBloodTknContr();
    var bal = await bloodToken.methods.balanceOf(ethereum.selectedAddress).call();
    var bal = bal / (10 ** 18);
    term.echo(`Your current Blood Token Balance is ${bal}`);
}

cssVars();

