/** 66 books: id, canonical name, chapter count, accepted aliases (lowercase, no spaces/periods). */
export interface Book { id: string; name: string; chapters: number; aliases: string[] }

const b = (id: string, name: string, chapters: number, ...aliases: string[]): Book => ({ id, name, chapters, aliases })

export const BOOKS: Book[] = [
  b('GEN','Genesis',50,'gen','ge','gn'), b('EXO','Exodus',40,'exo','ex','exod'), b('LEV','Leviticus',27,'lev','le','lv'),
  b('NUM','Numbers',36,'num','nu','nm','nb'), b('DEU','Deuteronomy',34,'deut','deu','dt','de'),
  b('JOS','Joshua',24,'josh','jos','jsh'), b('JDG','Judges',21,'judg','jdg','jg','jdgs'), b('RUT','Ruth',4,'ruth','rth','ru'),
  b('1SA','1 Samuel',31,'1sam','1sa','1sm','1s','isam','1samuel'), b('2SA','2 Samuel',24,'2sam','2sa','2sm','2s','iisam','2samuel'),
  b('1KI','1 Kings',22,'1kgs','1ki','1k','1kings','iki'), b('2KI','2 Kings',25,'2kgs','2ki','2k','2kings','iiki'),
  b('1CH','1 Chronicles',29,'1chr','1ch','1chron','1chronicles'), b('2CH','2 Chronicles',36,'2chr','2ch','2chron','2chronicles'),
  b('EZR','Ezra',10,'ezra','ezr'), b('NEH','Nehemiah',13,'neh','ne'), b('EST','Esther',10,'esth','est','es'),
  b('JOB','Job',42,'job','jb'), b('PSA','Psalms',150,'ps','psa','psalm','psalms','pss','psm'), b('PRO','Proverbs',31,'prov','pro','pr','prv'),
  b('ECC','Ecclesiastes',12,'eccl','ecc','ec','qoh'), b('SNG','Song of Solomon',8,'song','sos','songofsolomon','songofsongs','canticles','ss'),
  b('ISA','Isaiah',66,'isa','is'), b('JER','Jeremiah',52,'jer','je','jr'), b('LAM','Lamentations',5,'lam','la'),
  b('EZK','Ezekiel',48,'ezek','eze','ezk'), b('DAN','Daniel',12,'dan','da','dn'), b('HOS','Hosea',14,'hos','ho'),
  b('JOL','Joel',3,'joel','jl'), b('AMO','Amos',9,'amos','am'), b('OBA','Obadiah',1,'obad','ob'), b('JON','Jonah',4,'jonah','jnh'),
  b('MIC','Micah',7,'mic','mc'), b('NAM','Nahum',3,'nah','na'), b('HAB','Habakkuk',3,'hab','hb'), b('ZEP','Zephaniah',3,'zeph','zep','zp'),
  b('HAG','Haggai',2,'hag','hg'), b('ZEC','Zechariah',14,'zech','zec','zc'), b('MAL','Malachi',4,'mal','ml'),
  b('MAT','Matthew',28,'matt','mat','mt'), b('MRK','Mark',16,'mark','mrk','mk','mr'), b('LUK','Luke',24,'luke','luk','lk'),
  b('JHN','John',21,'john','jhn','jn'), b('ACT','Acts',28,'acts','act','ac'), b('ROM','Romans',16,'rom','ro','rm'),
  b('1CO','1 Corinthians',16,'1cor','1co','1corinthians','icor'), b('2CO','2 Corinthians',13,'2cor','2co','2corinthians','iicor'),
  b('GAL','Galatians',6,'gal','ga'), b('EPH','Ephesians',6,'eph','ep'), b('PHP','Philippians',4,'phil','php','pp','philippians'),
  b('COL','Colossians',4,'col','co'), b('1TH','1 Thessalonians',5,'1thess','1th','1thes','1thessalonians'),
  b('2TH','2 Thessalonians',3,'2thess','2th','2thes','2thessalonians'), b('1TI','1 Timothy',6,'1tim','1ti','1timothy'),
  b('2TI','2 Timothy',4,'2tim','2ti','2timothy'), b('TIT','Titus',3,'titus','tit','ti'), b('PHM','Philemon',1,'phlm','phm','philemon','pm'),
  b('HEB','Hebrews',13,'heb','he'), b('JAS','James',5,'jas','jm','james'), b('1PE','1 Peter',5,'1pet','1pe','1pt','1peter'),
  b('2PE','2 Peter',3,'2pet','2pe','2pt','2peter'), b('1JN','1 John',5,'1john','1jn','1jhn','1jo'), b('2JN','2 John',1,'2john','2jn','2jhn','2jo'),
  b('3JN','3 John',1,'3john','3jn','3jhn','3jo'), b('JUD','Jude',1,'jude','jud'), b('REV','Revelation',22,'rev','re','revelation','revelations','apocalypse'),
]

const aliasIndex = new Map<string, Book>()
for (const book of BOOKS) {
  aliasIndex.set(book.name.toLowerCase().replace(/[\s.]/g, ''), book)
  for (const a of book.aliases) aliasIndex.set(a, book)
}

export function findBook(raw: string): Book | undefined {
  const key = raw.toLowerCase().replace(/[\s.]/g, '').replace(/^i{1,3}(?=[a-z])/, m => String(m.length))
  return aliasIndex.get(key)
}
