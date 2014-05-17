const SIZE_BOARD = 8; // Ставим размер доски
const TAG_TR = "<tr></tr>";
const TAG_TD = "<td></td>";
var rows = columns = "";
for (var i = 0; i < SIZE_BOARD; i++) {
	rows = rows + TAG_TR;
	columns = columns + TAG_TD;
}
// Рисуем доску
$("tbody").html(rows);
$("tr").html(columns);
//-----------------------------------------------------------------------------------------------------------------------------------------------------------------
// Красим доску
var squaresSum = SIZE_BOARD*SIZE_BOARD; // всего полей
var oddrow = true; // нечётный ряд (первый)
for (var i = 0; i < squaresSum; i = i+SIZE_BOARD) { // ход по рядам (шаг: size ячеек)
	for (var j = +(oddrow); j < SIZE_BOARD; j += 2) { // заливаем квадраты тёмным через одну (начинаем с 1-й или со 2-й в зависимости от чётности)
		var $darkSquare = $("td").eq(i+j);
		$darkSquare.addClass("s_dark");
	}
	// меняем чётность
	oddrow = !oddrow;
}
//-----------------------------------------------------------------------------------------------------------------------------------------------------------------
// посчитаем количество необходимых для шашек полей на одного игрока, где -1 вычёркивает пустой ряд
var playerPiecesSum = Math.floor( ( (SIZE_BOARD/2).toFixed(0) - 1  ) * SIZE_BOARD / 2 );
for (var i = 0; i < playerPiecesSum; i++) {
	$darkSquare = $(".s_dark").eq(i);
	$darkSquare.append('<div class="piece p_dark"></div>');
}
// считаем с какого поля ставить белые шашки, вычитая из общего количества тёмных полей количество полей для тёмных шашек
var darkSquaresSum = Math.floor(squaresSum/2);
var firstLowPieceNum =  darkSquaresSum - playerPiecesSum;
for (var i = firstLowPieceNum; i < darkSquaresSum; i++) {
	$darkSquare = $(".s_dark").eq(i);
	$darkSquare.append('<div class="piece p_light available"></div>');
}
//--------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Следующие 2 функции поворачивают доску: 1-я - как визуальный эффект, 2-я - логически (переставляет шашки)
function turnAnim() {
	var deg = 0;
	var timer = setInterval(frame, 10) // вызывает  frame() каждые 10мс
	function frame() {
		deg += 20;
		
		$("table").css("transform", "rotate("+deg+"deg)");
		$(".piece").css("transform", "rotate("+ -deg +"deg)");
		
		if (deg == 180) { 
			clearInterval(timer); // завершить анимацию
			// поворачиваем доску
			$("table").css("transform", "rotate("+ 0 +"deg)");
			// поворачиваем шашки
			$(".p_light").css("transform", "rotate("+ 0 +"deg)");
			$(".p_dark").css("transform", "scale(-1, 1)");
			turnLogic();
		}
	}
}
function turnLogic() {
	// при повороте переносим доступность с шашек ходившего на шашки ходящего, переписывая им класс "available"
	if ( $(".available").hasClass("p_light") ) {
		$(".p_light").removeClass("available");
		$(".p_dark").addClass("available");
	} else {
		$(".p_dark").removeClass("available");
		$(".p_light").addClass("available");
	}
	//перерисовываем доску
	$("body").append("<table border align='center'><tbody></tbody></table>");
	$("table:eq(1) tbody").html(rows);
	n = 0;
	for (var i = SIZE_BOARD-1; i >= 0; i-- ) {
		$("tbody:eq(1) tr").eq(n).append( $("tr:eq(" + i + ") td").get().reverse() );
		n++;
	}
	$("table:first").remove();
}
//--------------------------------------------------------------------------------------------------------------------------------------------------------------------
Piece = new Object();
// Взаимодействие с шашками (игровая логика)
Piece.access = function() {
	console.log("Access to low-side pieces granted. Now you can interract with them.");//DEBUGGING
	var pieceIsHere; // здесь будет храниться td с последней выбранной шашкой, даже после снятия выбора
	$("td").on("click", function() {
		
		// Выбрать шашку
		var pieceIsChosen = Piece.choose(this); // получаем td поля с выбранной шашкой
		
		// Ходить
		if (pieceIsChosen) pieceIsHere = pieceIsChosen;
		moveDescribe(pieceIsHere, this);
	});
};
//-------------------------------------------------------------------------------------------------------------------------------------------
Piece.choose = function(element) {
	// тёмное поле && шашка доступна игроку
	if ( $(element).children("div") && $(element).children().hasClass("available") ){
		if ( $("#chosen") ) $("#chosen").remove(); // отключить множественную индикацию
		$(element).children().append('<img id="chosen" src="chosen.gif"></img>') // индикация "Выбрано"
		return element;
	} else { 
		$("#chosen").remove(); // откл. "Выбрано"
		return false;
	}
};

//Описывает действие игрока в 4-х значениях: td шашки, td её нового поля, числовое представление диагонали выбранного хода и на сколько полей ход
function moveDescribe(td_from, td_to) {
	var iFrom = iGet(td_from);
	var iTo = iGet(td_to);
	// имеем выбранную шашку && не имеет шашки
	if ( td_from && !( $(td_to).children().hasClass("piece") ) ) {
		var move = null;
		var squaresPassed;
		var back = (iFrom < iTo) ? true : false; 
		// проверяем все поля каждой диагонали выбранной шашки, куда она может встать
		if (back) { // если ход назад
			// диагональ "назад влево"
			move = SIZE_BOARD-1;
			squaresPassed = checkDiag(move, back, iFrom, iTo);
			if ( squaresPassed ) {
				moveDetermine(td_from, td_to, move, squaresPassed);
				return;
			}
			// диагональ"назад вправо"
			move = SIZE_BOARD+1;
			squaresPassed = checkDiag(move, back, iFrom, iTo);
			if ( squaresPassed ) {
				moveDetermine(td_from, td_to, move, squaresPassed);
				return; 
			}
		}
		else { // если ход вперед
			// диагональ "вперёд влево"
			move = -(SIZE_BOARD+1);
			squaresPassed = checkDiag(move, back, iFrom, iTo);
			if ( squaresPassed ) {
				moveDetermine(td_from, td_to, move, squaresPassed);
				return; 
			}
			// диагональ "вперёд впарво"
			move = -(SIZE_BOARD-1);
			squaresPassed = checkDiag(move, back, iFrom, iTo);
			if ( squaresPassed ) {
				moveDetermine(td_from, td_to, move, squaresPassed);
				return; 
			}
		}
	}
}
// получить индекс td
function iGet(td) {
	var index = $("td").index(td);
	return index;
}
function checkDiag(move, back, iFrom, iTo) {
	var squaresPassed = 0;
	if (back) 
		for (var i = iFrom + move; i <= iTo; i += move) {
				squaresPassed++;
				if (i == iTo) return squaresPassed;
		}
	else 
		for (var i = iFrom + move; i >= iTo; i +=move) {
				squaresPassed++;
				if (i == iTo) return squaresPassed;
		}
}
//Определяет ход по описанию и выполняет / не выполняет его в зависимости от полномочий
function moveDetermine(td_from, td_to, move, squaresPassed) {
	var move_desc;
	if (move == SIZE_BOARD-1) move_desc = "back-left";
	if (move == SIZE_BOARD+1) move_desc = "back-right";
	if (move == -(SIZE_BOARD+1)) move_desc = "forward-left";
	if (move == -(SIZE_BOARD-1)) move_desc = "forward-right";
	
	// Ход вперёд
	if ( move_desc == "forward-left" || move_desc == "forward-right" ) {
		// простой ход
		if (squaresPassed == 1) {
			document.getElementById('snd_man_move').play(); //sound
			Piece.redraw(td_from, td_to);
			// превращение в дамку
			if ( iGet(td_to) < SIZE_BOARD ) {
				if ( !$(td_from).children().hasClass("dame") ) {
					$(td_to).children().addClass("dame");
					document.getElementById('snd_indame').play(); //sound
				}
			}
		}
		// простой бой
		if (squaresPassed == 2) {
			// проверяем наличие шашки противника
			var i_opponentPieceSquare = iGet(td_from) + move;
			var $toCaptureSquare = $("td").eq(i_opponentPieceSquare);
			// если поле содержит шашку && эта шашка не своя
			if ( ( $toCaptureSquare.children().hasClass("piece") ) && !$toCaptureSquare.children().hasClass("available") ){
				document.getElementById('snd_capture').play(); //sound
				Piece.redraw(td_from, td_to);
				$toCaptureSquare.children().remove(); // убрать шашку противника
				$toCaptureSquare.append("<div id='eff_explosion'></div>");// effect
				setTimeout( function() { $toCaptureSquare.children("#eff_explosion").remove() }, 500 ); // effect remove
			}
			// превращение в дамку
			if ( iGet(td_to) < SIZE_BOARD ) {
				if ( !$(td_from).children().hasClass("dame") ) {
					$(td_to).children().addClass("dame");
					document.getElementById('snd_indame').play(); //sound
				}
			}
		}
	}
	
	// Ход назад
	else {
		// если не дамка - простой бой (тоже самое, что в if)
		if (squaresPassed == 2) {
			// проверяем наличие шашки противника
			var i_opponentPieceSquare = iGet(td_from) + move;
			var $toCaptureSquare = $("td").eq(i_opponentPieceSquare);
			// если поле содержит шашку && эта шашка не своя
			if ( ( $toCaptureSquare.children().hasClass("piece") ) && !( $toCaptureSquare.children().hasClass("available") ) ){
				document.getElementById('snd_capture').play(); //sound
				Piece.redraw(td_from, td_to);
				$toCaptureSquare.children().remove(); // убрать шашку противника
				$toCaptureSquare.append("<div id='eff_explosion'></div>");// effect
				setTimeout( function() { $toCaptureSquare.children("#eff_explosion").remove() }, 500 ); // effect remove
			}
		}
	}
	
	// ход дамки
	if ( $(td_from).children().hasClass("dame") ) {
		var crossed = opponentsPiecesCrossed(td_from, td_to, move)
		if ( !crossed ) {
			Piece.redraw(td_from, td_to);
			//snd
		}
		if ( $.isNumeric(crossed) ) {
			document.getElementById('snd_capture').play(); //sound
			Piece.redraw(td_from, td_to);
			$("td").eq(crossed).children().remove(); // убрать шашку противника
			$("td").eq(crossed).append("<div id='eff_explosion'></div>");// effect
			setTimeout( function() { $("td").eq(crossed).children("#eff_explosion").remove() }, 500 ); // effect remove
		}
	}
	
}

Piece.redraw = function(from, to) {
	var removed = $(from).children(".piece").remove();
	$(to).append( removed );
}
// функция определяет пересекает ли ход шашку. Возвр. знач.(4): пересекает свою - строка "ally", пересекает одну противника - её индекс, не пересекает  - undefined, перескает больше одной противника - строка "not_one"
function opponentsPiecesCrossed(td_from, td_to, move) {
	iFrom = iGet(td_from);
	iTo = iGet(td_to);
	var back = (iFrom < iTo) ? true : false;
	var crossed = 0;
	var i_oneOpponentPiece;
	if (back) {
		for (var i = iFrom + move; i <= iTo; i += move) {
				if ( $("td").eq(i).children().hasClass("available") ) return "ally"
				else if ( $("td").eq(i).children().hasClass("piece") ) {
					crossed += 1;
					if (crossed == 1) i_oneOpponentPiece = i;
				}
		}
		if (crossed == 1) return i_oneOpponentPiece;
		if (crossed > 1) return "not_one";
	}
	else {
		for (var i = iFrom + move; i >= iTo; i += move) {
				if ( $("td").eq(i).children().hasClass("available") ) return "ally"
				else if ( $("td").eq(i).children().hasClass("piece") ) {
					crossed += 1;
					if (crossed == 1) i_oneOpponentPiece = i;
				}
		}
		if (crossed == 1) return i_oneOpponentPiece;
		if (crossed > 1) return "not_one";
	}
}

Piece.access();